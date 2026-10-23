const fs    = require('fs');
const path  = require('path');
const axios = require('axios');
const yts   = require('yt-search');
const { toAudio, detectAudioFormat } = require('../../lib/toAudio');
const { menuBox } = require('../../lib/menuBox');

const TMP = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

const AX = {
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

function sc(str) {
    const m = {a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'s',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'};
    return String(str).toLowerCase().split('').map(c => m[c]||c).join('');
}

async function tryWithRetry(fn, times = 2) {
    let last;
    for (let i = 1; i <= times; i++) {
        try { return await fn(); } catch (e) { last = e; if (i < times) await new Promise(r => setTimeout(r, 500)); }
    }
    throw last;
}

function getPrexzyAudioUrl(data) {
    const values = [
        data?.audio_url, data?.audioUrl, data?.download_url, data?.downloadUrl, data?.url,
        data?.data?.audio_url, data?.data?.audioUrl, data?.data?.download_url, data?.data?.downloadUrl, data?.data?.url,
        data?.data?.audio?.url, data?.data?.download?.url,
        data?.result?.audio_url, data?.result?.audioUrl, data?.result?.download_url,
        data?.result?.downloadUrl, data?.result?.url, data?.result?.download?.url,
    ];
    return values.find(value => typeof value === 'string' && /^https?:\/\//i.test(value)) || null;
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

async function getFollowingRedirects(url, options = {}, maxRedirects = 5) {
    let currentUrl = url;
    for (let attempt = 0; attempt <= maxRedirects; attempt++) {
        const response = await axios.get(currentUrl, {
            ...options,
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 400
        });
        if (!REDIRECT_STATUSES.has(response.status)) {
            if (response.status >= 400) throw new Error('HTTP status: ' + response.status);
            return response;
        }

        const location = response.headers?.location;
        response.data?.destroy?.();
        if (!location) {
            throw new Error('Redirect missing Location header (HTTP status: ' + response.status + ')');
        }
        currentUrl = new URL(location, currentUrl).toString();
    }
    throw new Error('Too many redirects (>' + maxRedirects + ')');
}

async function getAudioUrl(videoUrl) {
    const enc  = encodeURIComponent(videoUrl);
    const apis = [
        { name: 'Prexzy', url: `https://prexzyapis.com/download/ytmp3?url=${enc}`, get: getPrexzyAudioUrl },
    ];
    for (const api of apis) {
        try {
            const { data } = await tryWithRetry(() => getFollowingRedirects(api.url, AX), 2);
            const url = api.get(data);
            if (url?.startsWith('http')) { console.log('[play] via', api.name); return url; }
        } catch (e) {
            const reason = e?.message || String(e);
            console.log('[play] miss:', api.name, reason.slice(0, 80));
        }
    }
    return null;
}

async function downloadBuffer(url) {
    const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
    try {
        const r = await getFollowingRedirects(url, {
            responseType: 'arraybuffer', timeout: 90000,
            maxContentLength: MAX_AUDIO_BYTES, maxBodyLength: MAX_AUDIO_BYTES,
            headers: { 'User-Agent': AX.headers['User-Agent'], 'Accept': '*/*', 'Accept-Encoding': 'identity' }
        });
        const contentType = String(r.headers?.['content-type'] || '').toLowerCase();
        const buf = Buffer.from(r.data);
        if (buf.length > 1000 && buf.length <= MAX_AUDIO_BYTES &&
            !/text\/(?:html|plain)|application\/(?:json|html)/i.test(contentType)) return buf;
    } catch {}

    // Stream fallback
    const r = await getFollowingRedirects(url, {
        responseType: 'stream', timeout: 90000,
        maxContentLength: MAX_AUDIO_BYTES, maxBodyLength: MAX_AUDIO_BYTES,
        headers: { 'User-Agent': AX.headers['User-Agent'], 'Accept': '*/*', 'Accept-Encoding': 'identity' }
    });
    const streamType = String(r.headers?.['content-type'] || '').toLowerCase();
    if (/text\/(?:html|plain)|application\/(?:json|html)/i.test(streamType)) {
        r.data.destroy?.();
        throw new Error('Provider returned ' + (streamType || 'text') + ' instead of audio');
    }
    const chunks = [];
    let total = 0;
    await new Promise((res, rej) => {
        r.data.on('data', c => {
            total += c.length;
            if (total > MAX_AUDIO_BYTES) {
                r.data.destroy(new Error('Audio download exceeds the 50 MB limit.'));
                return;
            }
            chunks.push(c);
        });
        r.data.on('end', res);
        r.data.on('error', rej);
    });
    return Buffer.concat(chunks);
}

function downloadWithYtdl(videoUrl) {
    const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
    const ytdl = require('@distube/ytdl-core');
    return new Promise((resolve, reject) => {
        const stream = ytdl(videoUrl, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
        });
        const chunks = [];
        let total = 0;
        const timer = setTimeout(() => {
            stream.destroy(new Error('Direct YouTube audio timed out.'));
        }, 90000);
        const finish = (error, buffer) => {
            clearTimeout(timer);
            if (error) reject(error);
            else resolve(buffer);
        };
        stream.on('data', chunk => {
            total += chunk.length;
            if (total > MAX_AUDIO_BYTES) {
                stream.destroy(new Error('Audio download exceeds the 50 MB limit.'));
                return;
            }
            chunks.push(chunk);
        });
        stream.once('error', error => finish(error));
        stream.once('end', () => {
            const buffer = Buffer.concat(chunks);
            if (buffer.length < 1000) return finish(new Error('YouTube returned an empty audio stream.'));
            finish(null, buffer);
        });
    });
}

module.exports = {
    name: 'play',
    // NOTE: kept aliases scoped to what's unique to play/song — 'ytmp3'
    // and 'youtubemp3' are already claimed by commands/media/ytdl.js and
    // commands/media/ytmp3.js. Reusing them here would silently steal
    // those commands' names depending on file load order (last-loaded
    // wins in the loader's command map), so they're deliberately left out.
    aliases: ['song', 'music', 'mp3'],
    category: 'media',
    desc: 'Search and download audio by song name',
    usage: '†play [song name]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = ctx.text;
        if (!q) return ctx.reply(`❌ Usage: \`${s.prefix}play [song name]\`${s.FOOTER}`);
        await ctx.react('🎵');

        try {
            const { videos } = await yts(q);
            const video = videos?.[0];
            if (!video) return ctx.reply(`❌ No results for *${q}*${s.FOOTER}`);
            if (video.seconds > 600) return ctx.reply(`❌ Too long (${video.timestamp}). Max 10 min.${s.FOOTER}`);

            // Send thumbnail with downloading status
            const ytId = (video.url.match(/(?:[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/) || [])[1];
            if (ytId) {
                try {
                    const thumb = await axios.get(`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`, { responseType: 'arraybuffer', timeout: 8000 });
                    await sock.sendMessage(ctx.from, {
                        image: Buffer.from(thumb.data),
                        caption: menuBox('🎵', 'ᴘʟᴀʏ', [
                            `*${sc('title')}:* ${video.title.slice(0, 55)}`,
                            `*${sc('artist')}:* ${video.author?.name || 'Unknown'}`,
                            `*${sc('duration')}:* ${video.timestamp}`,
                            `*${sc('status')}:* ⬇️ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...`,
                        ]) + s.FOOTER
                    }, { quoted: msg });
                } catch {}
            }

            await ctx.react('⬇️');

            // Download audio URL from APIs
            const audioUrl = await getAudioUrl(video.url);
            let audioBuffer = null;
            if (audioUrl) {
                try {
                    audioBuffer = await downloadBuffer(audioUrl);
                } catch (e) {
                    console.log('[play] Prexzy media download failed:', e.message.slice(0, 100));
                }
            }
            if (!audioBuffer || audioBuffer.length < 1000) {
                console.log('[play] falling back to the bundled YouTube audio stream');
                audioBuffer = await downloadWithYtdl(video.url);
            }
            if (!audioBuffer || audioBuffer.length < 1000) return ctx.reply(`❌ Download failed — empty file.${s.FOOTER}`);

            // Detect format from file headers (mini bot approach)
            const { mime, ext } = detectAudioFormat(audioBuffer);
            let finalBuffer = audioBuffer;
            let finalMime   = 'audio/mpeg';

            // Convert non-MP3 to MP3 using ffmpeg (ensures WhatsApp compatibility)
            if (ext !== 'mp3') {
                try {
                    finalBuffer = await toAudio(audioBuffer, ext);
                    if (!finalBuffer || finalBuffer.length < 1000) throw new Error('empty');
                    console.log(`[play] converted ${ext} → mp3`);
                } catch (e) {
                    // Conversion failed — send original with detected mime
                    console.log('[play] convert failed, sending original:', e.message);
                    finalBuffer = audioBuffer;
                    finalMime   = mime;
                }
            }

            // Send audio
            await sock.sendMessage(ctx.from, {
                audio: finalBuffer,
                mimetype: finalMime,
                ptt: false,
                fileName: `${video.title.slice(0, 50)}.mp3`
            }, { quoted: msg });

            // Done card
            await sock.sendMessage(ctx.from, {
                text: menuBox('🎵', 'ᴘʟᴀʏ', [
                    `${sc('title')}: ${video.title.slice(0, 55)}`,
                    `${sc('artist')}: ${video.author?.name || 'Unknown'}`,
                    `${sc('duration')}: ${video.timestamp}`,
                    `${sc('views')}: ${(video.views||0).toLocaleString()}`,
                    `${sc('status')}: ✅ ᴅᴏɴᴇ`,
                ]) + s.FOOTER
            }, { quoted: msg });

            await ctx.react('✅');

        } catch (err) {
            const errorText = err?.message || String(err || 'Unknown playback error');
            console.error('[play]', errorText);
            ctx.reply(`❌ ${errorText.toLowerCase().includes('blocked') ? 'Content blocked/unavailable.' : errorText.slice(0, 80)}${s.FOOTER}`);
            ctx.react('❌').catch(() => {});
        }
    }
};

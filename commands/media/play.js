const fs    = require('fs');
const path  = require('path');
const axios = require('axios');
const yts   = require('yt-search');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { menuBox } = require('../../lib/menuBox');

const TMP = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

function sc(str) {
    const m = {a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'s',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'};
    return String(str).toLowerCase().split('').map(c => m[c]||c).join('');
}

// ── DOWNLOAD BUFFER ──
async function downloadBuffer(url, timeout = 90000) {
    const r = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    return Buffer.from(r.data);
}

// ── API 1: COBALT (most stable 2026) ──
async function getCobalt(url) {
    try {
        const res = await axios.post('https://api.cobalt.tools/api/json', {
            url: url, isAudioOnly: true, aFormat: 'mp3', filenamePattern: 'basic'
        }, {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            timeout: 20000
        });
        if (res.data?.url) return res.data.url;
        if (res.data?.status === 'redirect' || res.data?.status === 'tunnel') return res.data.url;
        return null;
    } catch (e) { console.log('[play] cobalt fail', e.message.slice(0,50)); return null; }
}

// ── API 2: VEZON (yt mp3 api) ──
async function getVezon(url) {
    try {
        const res = await axios.get(`https://api.ryzumi.vip/api/downloader/youtube-mp3?url=${encodeURIComponent(url)}`, { timeout: 15000 });
        const audio = res.data?.data?.download || res.data?.result?.download || res.data?.url;
        if (audio?.startsWith('http')) return audio;
        return null;
    } catch (e) { return null; }
}

// ── API 3: LOLHUMAN / SAVETUBE ──
async function getLol(url) {
    try {
        const res = await axios.get(`https://api.lolhuman.xyz/api/ytplay2?apikey=GataDios&query=${encodeURIComponent(url)}`, { timeout: 15000 });
        const audio = res.data?.result?.audio || res.data?.audio;
        if (audio?.startsWith('http')) return audio;
        return null;
    } catch { return null; }
}

// ── API 4: YT-DLP EXEC (local) ──
async function getYtDlp(url, outPath) {
    try {
        const cookiePath = path.join(process.cwd(), 'cookies.txt');
        const hasCookies = fs.existsSync(cookiePath);
        const cookieArg = hasCookies ? `--cookies "${cookiePath}"` : '';
        const cmds = [
            `yt-dlp ${cookieArg} --extractor-args "youtube:player_client=android" -f bestaudio --extract-audio --audio-format mp3 -o "${outPath}" --no-playlist --no-warnings "${url}" 2>&1`,
            `yt-dlp ${cookieArg} --extractor-args "youtube:player_client=ios" -f bestaudio --extract-audio --audio-format mp3 -o "${outPath}" --no-playlist "${url}" 2>&1`
        ];
        for (let cmd of cmds) {
            try {
                await execPromise(cmd, { timeout: 120000 });
                if (fs.existsSync(outPath) && fs.statSync(outPath).size > 5000) return true;
            } catch {}
        }
        return false;
    } catch { return false; }
}

module.exports = {
    name: 'play',
    aliases: ['song', 'music', 'mp3', 'ytmp3', 'playdoc'],
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

            const cleanUrl = video.url.replace(/youtube\.com\/shorts\//, 'youtube.com/watch?v=').split('&si=')[0].split('?si=')[0];

            // Thumbnail
            try {
                const ytId = (video.url.match(/(?:[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/) || [])[1];
                if (ytId) {
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
                }
            } catch {}

            const id = Date.now();
            const outPath = path.join(TMP, `${id}.mp3`);
            let audioBuffer = null;
            let source = '';

            // 1. TRY YT-DLP LOCAL FIRST (best quality)
            await ctx.react('⬇️');
            const ytdlpOk = await getYtDlp(cleanUrl, outPath);
            if (ytdlpOk) {
                audioBuffer = fs.readFileSync(outPath);
                source = 'yt-dlp';
            }

            // 2. TRY COBALT API
            if (!audioBuffer) {
                console.log('[play] trying cobalt');
                const cobaltUrl = await getCobalt(cleanUrl);
                if (cobaltUrl) {
                    try {
                        audioBuffer = await downloadBuffer(cobaltUrl);
                        source = 'cobalt';
                    } catch {}
                }
            }

            // 3. TRY VEZON API
            if (!audioBuffer) {
                console.log('[play] trying vezon');
                const vezonUrl = await getVezon(cleanUrl);
                if (vezonUrl) {
                    try {
                        audioBuffer = await downloadBuffer(vezonUrl);
                        source = 'vezon';
                    } catch {}
                }
            }

            // 4. TRY LOL API
            if (!audioBuffer) {
                console.log('[play] trying lolhuman');
                const lolUrl = await getLol(cleanUrl);
                if (lolUrl) {
                    try {
                        audioBuffer = await downloadBuffer(lolUrl);
                        source = 'lolhuman';
                    } catch {}
                }
            }

            if (!audioBuffer || audioBuffer.length < 1000) {
                return ctx.reply(`❌ Download failed — all 4 sources blocked.\n• yt-dlp: ${ytdlpOk ? 'ok but file small' : 'error/429'}\n• cobalt/vezon/lol: blocked\n\n💡 FIX: Upload cookies.txt to bot root. Then retry.${s.FOOTER}`);
            }

            console.log(`[play] success via ${source} - ${audioBuffer.length} bytes`);

            await sock.sendMessage(ctx.from, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: `${video.title.slice(0, 50)}.mp3`
            }, { quoted: msg });

            await sock.sendMessage(ctx.from, {
                text: menuBox('🎵', 'ᴘʟᴀʏ', [
                    `${sc('title')}: ${video.title.slice(0, 55)}`,
                    `${sc('artist')}: ${video.author?.name || 'Unknown'}`,
                    `${sc('duration')}: ${video.timestamp}`,
                    `${sc('source')}: ${source}`,
                    `${sc('status')}: ✅ ᴅᴏɴᴇ`,
                ]) + s.FOOTER
            }, { quoted: msg });

            await ctx.react('✅');
            try { fs.unlinkSync(outPath); } catch {}

        } catch (err) {
            console.error('[play]', err);
            ctx.reply(`❌ ${err.message.slice(0,150)}${s.FOOTER}`);
            ctx.react('❌').catch(() => {});
        }
    }
};
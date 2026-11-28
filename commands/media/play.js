// language: JavaScript, file: commands/media/play.js
'use strict';
/*
 * MADARA X-MD — .play (full track)
 *
 * Root cause of 123tokyo.xyz 404 (confirmed from Megan response analysis):
 *   - URL param `s=` = Unix timestamp expiry (set at Megan generation time)
 *   - URL param `uN=` = base64 Megan username — URL is IP-locked to Megan servers
 *   - Downloading from 123tokyo.xyz will ALWAYS fail from an external IP
 *
 * Fix: Megan is used ONLY to resolve query → videoId + youtubeUrl + title + thumbnail.
 *      Actual audio download is done by us via @distube/ytdl-core.
 *
 * Pipeline:
 *   1. Megan /download/mp3  → videoId → @distube/ytdl-core download
 *   2. Megan /download/dlmp3 → videoId → @distube/ytdl-core download
 *   3. yt-search + @distube/ytdl-core (pure local, no external API)
 *   4. Deezer 30s preview
 *   5. iTunes 30s preview
 */

const axios  = require('axios');
const ytdl   = require('@distube/ytdl-core');
const yts    = require('yt-search');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const MAX_AUDIO_BYTES = 80 * 1024 * 1024; // 80 MB cap

// ── Megan API key ──
const MEGAN_KEY_DEFAULT = 'megan_feca93146d98848fcc856456ff5d2c9e';
function getMeganKey() {
    try {
        return process.env.MEGAN_API_KEY
            || require('../../settings').MEGAN_API_KEY
            || MEGAN_KEY_DEFAULT;
    } catch { return process.env.MEGAN_API_KEY || MEGAN_KEY_DEFAULT; }
}

// ── Download YouTube audio via @distube/ytdl-core ──
async function ytdlDownload(videoId) {
    const url  = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(url);
    const fmt  = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
    if (!fmt) throw new Error('ytdl: no audioonly format found');

    return new Promise((resolve, reject) => {
        const chunks   = [];
        let totalBytes = 0;
        const stream   = ytdl.downloadFromInfo(info, { format: fmt });
        stream.on('data', chunk => {
            totalBytes += chunk.length;
            if (totalBytes > MAX_AUDIO_BYTES) { stream.destroy(); return reject(new Error('ytdl: file too large')); }
            chunks.push(chunk);
        });
        stream.on('end',   () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

// ── Megan response parser — only metadata, ignore downloadUrl ──
function parseMeganMeta(data, query) {
    const d = data?.data || {};
    const videoId = d.videoId || null;
    return {
        videoId,
        title    : d.title     || query,
        duration : d.duration  || 0,
        thumbnail: d.thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null),
        youtubeUrl: d.youtubeUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : null),
    };
}

// ── Megan API call → metadata → ytdl download ──
async function fromMeganWithYtdl(endpoint, query) {
    const key    = getMeganKey();
    const isUrl  = /^https?:\/\//i.test(query);
    const params = { api_key: key };
    if (isUrl) params.url = query; else params.q = query;

    const { data } = await axios.get(`https://apis.megan.qzz.io/${endpoint}`, {
        params, timeout: 65000, headers: { 'User-Agent': UA },
    });

    if (!data?.status?.success) throw new Error(`Megan ${endpoint}: ${data?.status?.name || 'unknown'}`);

    const meta = parseMeganMeta(data, query);
    if (!meta.videoId) throw new Error(`Megan ${endpoint}: no videoId — ${JSON.stringify(data?.data).slice(0, 100)}`);

    console.log(`[play:megan/${endpoint}] "${meta.title}" → https://youtu.be/${meta.videoId}`);
    const buffer = await ytdlDownload(meta.videoId);
    console.log(`[play:megan/${endpoint}] downloaded ${(buffer.length / 1024 / 1024).toFixed(2)}MB`);

    return {
        source: 'Megan + ytdl', title: meta.title, author: 'Unknown',
        duration: meta.duration, views: 'N/A', thumbnail: meta.thumbnail,
        url: meta.youtubeUrl, buffer, ext: 'mp3', mimetype: 'audio/mpeg', isAudio: true,
    };
}

// ── Pure local fallback: yt-search → ytdl ──
async function fromYtSearch(query) {
    const result = await yts(query);
    const v = result?.videos?.[0];
    if (!v?.videoId) throw new Error('yt-search: no results');

    console.log(`[play:yts] "${v.title}" → https://youtu.be/${v.videoId}`);
    const buffer = await ytdlDownload(v.videoId);
    console.log(`[play:yts] downloaded ${(buffer.length / 1024 / 1024).toFixed(2)}MB`);

    return {
        source: 'YouTube', title: v.title, author: v.author?.name || 'Unknown',
        duration: v.seconds || 0, views: v.views || 0,
        thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        url: v.url, buffer, ext: 'mp3', mimetype: 'audio/mpeg', isAudio: true,
    };
}

// ── 30s preview fallbacks ──
async function fromDeezer(query) {
    try {
        const { data } = await axios.get('https://api.deezer.com/search', { params: { q: query }, timeout: 10000 });
        const t = data?.data?.[0];
        if (!t?.preview) return null;
        const audio = await axios.get(t.preview, { responseType: 'arraybuffer', timeout: 20000 });
        return {
            source: 'Deezer Preview (30s)', title: t.title, author: t.artist?.name,
            duration: t.duration, views: 'N/A', thumbnail: t.album?.cover_xl, url: t.link,
            buffer: Buffer.from(audio.data), ext: 'mp3', mimetype: 'audio/mpeg', isAudio: true,
        };
    } catch { return null; }
}

async function fromItunes(query) {
    try {
        const { data } = await axios.get('https://itunes.apple.com/search', {
            params: { term: query, media: 'music', limit: 1 }, timeout: 10000,
        });
        const t = data?.results?.[0];
        if (!t?.previewUrl) return null;
        const audio = await axios.get(t.previewUrl, { responseType: 'arraybuffer', timeout: 20000 });
        return {
            source: 'iTunes Preview (30s)', title: t.trackName, author: t.artistName,
            duration: Math.floor(t.trackTimeMillis / 1000), views: 'N/A',
            thumbnail: t.artworkUrl100?.replace('100x100', '600x600'), url: t.trackViewUrl,
            buffer: Buffer.from(audio.data), ext: 'm4a', mimetype: 'audio/mp4', isAudio: true,
        };
    } catch { return null; }
}

// ── Main pipeline ──
async function getAudio(query) {
    // 1. Megan /download/mp3 → videoId → ytdl
    try { const r = await fromMeganWithYtdl('download/mp3', query); if (r) return r; }
    catch (e) { console.log('[play:megan/mp3] failed:', e.message?.slice(0, 150)); }

    // 2. Megan /download/dlmp3 → videoId → ytdl
    try { const r = await fromMeganWithYtdl('download/dlmp3', query); if (r) return r; }
    catch (e) { console.log('[play:megan/dlmp3] failed:', e.message?.slice(0, 150)); }

    // 3. Pure local: yt-search + ytdl (no external API dependency)
    console.log('[play] Megan failed → yt-search fallback');
    try { const r = await fromYtSearch(query); if (r) return r; }
    catch (e) { console.log('[play:yts] failed:', e.message?.slice(0, 150)); }

    // 4–5. 30s preview last resort
    console.log('[play] all full-track sources failed → 30s preview');
    return (await fromDeezer(query)) || (await fromItunes(query)) || null;
}

// ── Helpers ──
function formatDuration(sec) {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Command ──
async function execute(sock, msg, args) {
    const from  = msg.key.remoteJid;
    const query = args.join(' ').trim();
    if (!query) return sock.sendMessage(from, { text: '❌ Usage: .play <song name>' }, { quoted: msg });

    try { await sock.sendMessage(from, { react: { text: '🎵', key: msg.key } }); } catch {}

    let statusMsg = null;
    try { statusMsg = await sock.sendMessage(from, { text: '⏳ Searching & downloading…' }, { quoted: msg }); } catch {}

    const result = await getAudio(query);

    if (statusMsg?.key) { try { await sock.sendMessage(from, { delete: statusMsg.key }); } catch {} }

    if (!result) {
        return sock.sendMessage(from, { text: '❌ No audio found for: ' + query }, { quoted: msg });
    }

    const isPreview = /preview/i.test(result.source);
    const caption =
`╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═══⊷❍
┃✰│━━━❮❮ 🎵 ᴘʟᴀʏ ❯❯━━━━━
┃✰│ᴛɪᴛʟᴇ: ${result.title}
┃✰│ᴀʀᴛɪ𝒔ᴛ: ${result.author}
┃✰│ᴅᴜʀᴀᴛɪᴏɴ: ${formatDuration(result.duration)}
┃✰│ꜱᴏᴜʀᴄᴇ: ${result.source}${isPreview ? '' : ' (full)'}
┃✰│ꜱᴛᴀᴛᴜꜱ: ✅ ᴅᴏɴᴇ
┃✰│──────────●●►
┃✰│   ▎0▌▌▉▏▎▌▉▐▏▌▎
┃✰│   ©𝐌𝐀𝐃𝐀𝐑𝐀 𝐗-𝐌𝐃
╰──────────────────
> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ☆ᴍᴀᴅᴀʀᴀ ɪɴᴄᴏʀᴘᴏʀᴀᴛɪᴏɴ.*`;

    await sock.sendMessage(from, {
        audio   : result.buffer,
        mimetype: result.mimetype || 'audio/mpeg',
        ptt     : false,
        fileName: `${String(result.title || 'track').replace(/[^\w\s-]/g, '').slice(0, 40)}.${result.ext || 'mp3'}`,
        caption,
        contextInfo: result.thumbnail ? {
            externalAdReply: {
                title                : String(result.title || '').slice(0, 60),
                body                 : String(result.author || '').slice(0, 40),
                mediaType            : 1,
                thumbnailUrl         : result.thumbnail,
                sourceUrl            : result.url || undefined,
                renderLargerThumbnail: true,
            },
        } : undefined,
    }, { quoted: msg });
}

module.exports = {
    name    : 'play',
    alias   : ['song', 'music', 'yt'],
    desc    : 'Play music (full track — Megan metadata + ytdl)',
    category: 'media',
    execute,
    run     : execute,
};

// language: JavaScript, file: commands/media/play.js
'use strict';
/*
 * MADARA X-MD — .play (full track)
 * Primary: Megan APIs (apis.megan.qzz.io) — /download/mp3 + /download/dlmp3
 * Fallback: Deezer/iTunes 30s preview
 * Removed: yt-dlp, drizzle/thesync, ryzendesu, nexoracle, siputzx
 *
 * Megan response shape (confirmed from live log):
 *   data.data.downloadUrl  — full signed MP3 URL (123tokyo.xyz)
 *   data.data.title        — track title
 *   data.data.videoId      — YouTube ID
 *   data.data.format       — "mp3"
 *   data.data.quality      — "320kbps"
 */

const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const MAX_AUDIO_BYTES = 80 * 1024 * 1024;

// ── Megan API key ──
const MEGAN_KEY_DEFAULT = 'megan_feca93146d98848fcc856456ff5d2c9e';
function getMeganKey() {
    try {
        return process.env.MEGAN_API_KEY
            || require('../../settings').MEGAN_API_KEY
            || MEGAN_KEY_DEFAULT;
    } catch { return process.env.MEGAN_API_KEY || MEGAN_KEY_DEFAULT; }
}

// ── Download a signed MP3 URL to buffer ──
// 123tokyo.xyz URLs are signed and expire — must follow redirects with correct headers
async function downloadMeganAudio(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 120000,
        maxContentLength: MAX_AUDIO_BYTES,
        maxRedirects: 10,
        headers: {
            'User-Agent': UA,
            'Accept': 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
            'Referer': 'https://apis.megan.qzz.io/',
        },
        validateStatus: s => s < 500,
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status} from download URL`);
    const buf = Buffer.from(res.data);
    if (!buf || buf.length < 10000) throw new Error(`Empty/tiny response (${buf?.length} bytes)`);
    return buf;
}

// ── Megan response parser (confirmed shape from live log) ──
function parseMeganResponse(data, query) {
    const d = data?.data || {};
    const dlUrl = d.downloadUrl || d.download_url || d.url || null;
    if (!dlUrl) return null;
    return {
        dlUrl,
        title    : d.title     || query,
        videoId  : d.videoId   || null,
        duration : d.duration  || 0,
        thumbnail: d.thumbnail || (d.videoId ? `https://i.ytimg.com/vi/${d.videoId}/hqdefault.jpg` : null),
    };
}

// ── /download/mp3 — search + multi-provider download ──
async function fromMeganMp3(query) {
    const key = getMeganKey();
    const isUrl = /^https?:\/\//i.test(query);
    const params = { api_key: key };
    if (isUrl) params.url = query;
    else        params.q  = query;

    const { data } = await axios.get('https://apis.megan.qzz.io/download/mp3', {
        params, timeout: 65000,
        headers: { 'User-Agent': UA },
    });

    if (!data?.status?.success) {
        throw new Error(`Megan /mp3 error: ${data?.status?.name || 'unknown'}`);
    }

    const parsed = parseMeganResponse(data, query);
    if (!parsed) throw new Error('No downloadUrl in /mp3 response: ' + JSON.stringify(data?.data).slice(0, 200));

    console.log('[play:megan/mp3] got URL for:', parsed.title, '→', parsed.dlUrl.slice(0, 80) + '…');
    const buffer = await downloadMeganAudio(parsed.dlUrl);
    console.log('[play:megan/mp3] downloaded', (buffer.length / 1024 / 1024).toFixed(2) + 'MB');

    return {
        source   : 'Megan APIs',
        title    : parsed.title,
        author   : 'Unknown',
        duration : parsed.duration,
        views    : 'N/A',
        thumbnail: parsed.thumbnail,
        url      : parsed.videoId ? `https://youtu.be/${parsed.videoId}` : null,
        buffer, ext: 'mp3', mimetype: 'audio/mpeg', isAudio: true,
    };
}

// ── /download/dlmp3 — direct MP3 ──
async function fromMeganDlmp3(query) {
    const key = getMeganKey();
    const isUrl = /^https?:\/\//i.test(query);
    const params = { api_key: key };
    if (isUrl) params.url = query;
    else        params.q  = query;

    const { data } = await axios.get('https://apis.megan.qzz.io/download/dlmp3', {
        params, timeout: 65000,
        headers: { 'User-Agent': UA },
    });

    if (!data?.status?.success) {
        throw new Error(`Megan /dlmp3 error: ${data?.status?.name || 'unknown'}`);
    }

    const parsed = parseMeganResponse(data, query);
    if (!parsed) throw new Error('No downloadUrl in /dlmp3 response: ' + JSON.stringify(data?.data).slice(0, 200));

    console.log('[play:megan/dlmp3] got URL for:', parsed.title, '→', parsed.dlUrl.slice(0, 80) + '…');
    const buffer = await downloadMeganAudio(parsed.dlUrl);
    console.log('[play:megan/dlmp3] downloaded', (buffer.length / 1024 / 1024).toFixed(2) + 'MB');

    return {
        source   : 'Megan APIs',
        title    : parsed.title,
        author   : 'Unknown',
        duration : parsed.duration,
        views    : 'N/A',
        thumbnail: parsed.thumbnail,
        url      : parsed.videoId ? `https://youtu.be/${parsed.videoId}` : null,
        buffer, ext: 'mp3', mimetype: 'audio/mpeg', isAudio: true,
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
    // 1. Megan /download/mp3
    try {
        const r = await fromMeganMp3(query);
        if (r) return r;
    } catch (e) { console.log('[play:megan/mp3] failed:', e.message?.slice(0, 150)); }

    // 2. Megan /download/dlmp3
    try {
        const r = await fromMeganDlmp3(query);
        if (r) return r;
    } catch (e) { console.log('[play:megan/dlmp3] failed:', e.message?.slice(0, 150)); }

    // 3. 30s preview fallbacks
    console.log('[play] Megan failed → 30s preview fallback');
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
    const from = msg.key.remoteJid;
    const query = args.join(' ').trim();
    if (!query) return sock.sendMessage(from, { text: '❌ Usage: .play <song name>' }, { quoted: msg });

    try { await sock.sendMessage(from, { react: { text: '🎵', key: msg.key } }); } catch {}

    let statusMsg = null;
    try {
        statusMsg = await sock.sendMessage(from, { text: '⏳ Searching & downloading…' }, { quoted: msg });
    } catch {}

    const result = await getAudio(query);

    if (statusMsg?.key) {
        try { await sock.sendMessage(from, { delete: statusMsg.key }); } catch {}
    }

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
    desc    : 'Play music (full track via Megan APIs)',
    category: 'media',
    execute,
    run     : execute,
};

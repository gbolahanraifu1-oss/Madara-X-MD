// language: JavaScript, file: commands/media/play.js
'use strict';
/*
 * MADARA X-MD — .play (full track)
 * Primary: Megan APIs (apis.megan.qzz.io) — /download/mp3 + /download/dlmp3
 * Fallback: Deezer/iTunes 30s preview
 * Removed: yt-dlp, drizzle/thesync, ryzendesu, nexoracle, siputzx
 */

const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const MAX_AUDIO_BYTES = 60 * 1024 * 1024;

// ── Megan API key ──
const MEGAN_KEY_DEFAULT = 'megan_feca93146d98848fcc856456ff5d2c9e';
function getMeganKey() {
    try {
        return process.env.MEGAN_API_KEY
            || require('../../settings').MEGAN_API_KEY
            || MEGAN_KEY_DEFAULT;
    } catch { return process.env.MEGAN_API_KEY || MEGAN_KEY_DEFAULT; }
}

async function downloadBuffer(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 90000,
        maxContentLength: MAX_AUDIO_BYTES,
        headers: { 'User-Agent': UA },
    });
    return Buffer.from(res.data);
}

// ── Extract download URL from various Megan response shapes ──
function extractMeganUrl(data) {
    // Try every known key name in order of likelihood
    return data?.download_url
        || data?.downloadUrl
        || data?.url
        || data?.result?.url
        || data?.result?.download_url
        || data?.result?.downloadUrl
        || data?.data?.url
        || data?.data?.download_url
        || data?.data?.downloadUrl
        || data?.link
        || data?.mp3
        || data?.audio
        || null;
}

function extractMeganMeta(data) {
    const r = data?.result || data?.data || data || {};
    return {
        title    : r.title    || r.name   || null,
        author   : r.artist   || r.author || r.channel || r.uploader || null,
        duration : r.duration || 0,
        thumbnail: r.thumbnail || r.thumb  || r.cover   || null,
        url      : r.source_url || r.webpage_url || r.youtubeUrl || null,
    };
}

// ── /download/mp3 — search by query or URL, multi-provider ──
async function fromMeganMp3(query) {
    const key = getMeganKey();
    if (!key) { console.log('[play:megan] No MEGAN_API_KEY set'); return null; }

    // Accept raw YT URLs or plain query strings
    const isUrl = /^https?:\/\//i.test(query);
    const params = { api_key: key };
    if (isUrl) params.url = query;
    else        params.q  = query;

    try {
        const { data } = await axios.get('https://apis.megan.qzz.io/download/mp3', {
            params, timeout: 60000,
            headers: { 'User-Agent': UA },
        });
        console.log('[play:megan/mp3] full response:', JSON.stringify(data).slice(0, 800));

        const dlUrl = extractMeganUrl(data);
        if (!dlUrl) {
            console.log('[play:megan/mp3] no download URL found in above response');
            return null;
        }

        const buffer = await downloadBuffer(dlUrl);
        if (!buffer || buffer.length < 10_000) return null;

        const meta = extractMeganMeta(data);
        console.log('[play:megan/mp3] success', (buffer.length / 1024 / 1024).toFixed(2) + 'MB');
        return {
            source   : 'Megan APIs',
            title    : meta.title    || query,
            author   : meta.author   || 'Unknown',
            duration : meta.duration || 0,
            views    : 'N/A',
            thumbnail: meta.thumbnail || null,
            url      : meta.url       || null,
            buffer, ext: 'mp3', mimetype: 'audio/mpeg', isAudio: true,
        };
    } catch (e) {
        console.log('[play:megan/mp3] fail:', e.message?.slice(0, 200));
        return null;
    }
}

// ── /download/dlmp3 — direct MP3 download ──
async function fromMeganDlmp3(query) {
    const key = getMeganKey();
    if (!key) return null;

    const isUrl = /^https?:\/\//i.test(query);
    const params = { api_key: key };
    if (isUrl) params.url = query;
    else        params.q  = query;

    try {
        const { data } = await axios.get('https://apis.megan.qzz.io/download/dlmp3', {
            params, timeout: 60000,
            headers: { 'User-Agent': UA },
        });
        console.log('[play:megan/dlmp3] full response:', JSON.stringify(data).slice(0, 800));

        const dlUrl = extractMeganUrl(data);
        if (!dlUrl) {
            console.log('[play:megan/dlmp3] no download URL found in above response');
            return null;
        }

        const buffer = await downloadBuffer(dlUrl);
        if (!buffer || buffer.length < 10_000) return null;

        const meta = extractMeganMeta(data);
        console.log('[play:megan/dlmp3] success', (buffer.length / 1024 / 1024).toFixed(2) + 'MB');
        return {
            source   : 'Megan APIs',
            title    : meta.title    || query,
            author   : meta.author   || 'Unknown',
            duration : meta.duration || 0,
            views    : 'N/A',
            thumbnail: meta.thumbnail || null,
            url      : meta.url       || null,
            buffer, ext: 'mp3', mimetype: 'audio/mpeg', isAudio: true,
        };
    } catch (e) {
        console.log('[play:megan/dlmp3] fail:', e.message?.slice(0, 200));
        return null;
    }
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
    // 1. Megan /download/mp3 (search + download, multi-provider)
    const r1 = await fromMeganMp3(query);
    if (r1) return r1;

    // 2. Megan /download/dlmp3 (direct)
    const r2 = await fromMeganDlmp3(query);
    if (r2) return r2;

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
                title             : String(result.title || '').slice(0, 60),
                body              : String(result.author || '').slice(0, 40),
                mediaType         : 1,
                thumbnailUrl      : result.thumbnail,
                sourceUrl         : result.url || undefined,
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

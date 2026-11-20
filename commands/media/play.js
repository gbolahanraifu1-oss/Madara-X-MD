'use strict';
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Innertube, UniversalCache } = require('youtubei.js');

// ========== COOKIES ==========
function loadCookiesTxt() {
    try {
        const file = path.join(process.cwd(), 'cookies.txt');
        if (!fs.existsSync(file)) {
            console.log('[play] No cookies.txt found');
            return '';
        }
        const raw = fs.readFileSync(file, 'utf8').trim();
        if (!raw) return '';
        if (!raw.includes('\n') && raw.includes('=')) {
            console.log(`[play] Loaded ${raw.split(';').length} cookies from cookies.txt`);
            return raw;
        }
        const cookies = [];
        for (const line of raw.split('\n')) {
            const t = line.trim();
            if (!t || t.startsWith('#')) continue;
            const parts = t.split('\t');
            if (parts.length >= 7) cookies.push(`${parts[5]}=${parts[6]}`);
            else if (t.includes('=')) cookies.push(t);
        }
        console.log(`[play] Loaded ${cookies.length} cookies from cookies.txt`);
        return cookies.join('; ');
    } catch (e) {
        console.log('[play] Cookies load fail:', e.message);
        return '';
    }
}
const COOKIE_STRING = process.env.YT_COOKIES || loadCookiesTxt();

// ========== YOUTUBE CLIENT (for search only) ==========
let ytClient = null;
async function getClient() {
    if (ytClient) return ytClient;
    ytClient = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true,
        cookie: COOKIE_STRING || undefined,
    });
    return ytClient;
}

async function searchYoutube(query) {
    try {
        const client = await getClient();
        const search = await client.search(query, { type: 'video' });
        const video = search.results?.[0];
        if (!video) return null;
        let info = null;
        try { info = await client.getInfo(video.id); } catch {}
        return {
            videoId: video.id,
            title: info?.basic_info?.title || video.title?.text || video.title || query,
            author: info?.basic_info?.author || video.author?.name || 'Unknown',
            duration: info?.basic_info?.duration || video.duration?.seconds || 0,
            views: info?.basic_info?.view_count || video.view_count?.text || '0',
            thumbnail: info?.basic_info?.thumbnail?.[0]?.url || video.thumbnails?.[0]?.url || '',
            url: `https://youtu.be/${video.id}`
        };
    } catch (e) {
        console.log('[play] Youtube search fail:', e.message?.slice(0, 120));
        return null;
    }
}

// ========== EXTERNAL YT MP3 - FULL SONG ==========
async function fromExternalYT(video) {
    const ytUrl = `https://youtu.be/${video.videoId}`;
    const apis = [
        `https://api.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(ytUrl)}`,
        `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(ytUrl)}`,
        `https://api.davidcyriltech.my.id/youtube/mp3?url=${encodeURIComponent(ytUrl)}`
    ];
    for (const apiUrl of apis) {
        try {
            const { data } = await axios.get(apiUrl, { timeout: 30000 });
            const r = data?.result || data?.data || data;
            const dl = r?.download_url || r?.downloadUrl || r?.dl || r?.url || r?.link;
            if (!dl) {
                console.log('[play] External API no link:', apiUrl.split('?')[0]);
                continue;
            }
            const audio = await axios.get(dl, { responseType: 'arraybuffer', timeout: 90000 });
            if (!audio.data?.length) continue;
            return {
                source: 'youtube-api',
                title: video.title,
                author: video.author,
                duration: video.duration,
                views: video.views,
                thumbnail: video.thumbnail,
                url: video.url,
                buffer: Buffer.from(audio.data),
                mimetype: 'audio/mpeg',
                isAudio: true
            };
        } catch (e) {
            console.log('[play] External API fail:', e.message?.slice(0, 100));
            continue;
        }
    }
    return null;
}

// ========== DEEZER (30s preview) ==========
async function fromDeezer(query) {
    try {
        const { data } = await axios.get('https://api.deezer.com/search', {
            params: { q: query }, timeout: 10000
        });
        const t = data?.data?.[0];
        if (!t?.preview) return null;
        const audio = await axios.get(t.preview, { responseType: 'arraybuffer', timeout: 20000 });
        return {
            source: 'Deezer/iTunes Preview',
            title: t.title, author: t.artist?.name, duration: t.duration,
            views: 'N/A', thumbnail: t.album?.cover_xl, url: t.link,
            buffer: Buffer.from(audio.data), mimetype: 'audio/mpeg', isAudio: true
        };
    } catch { return null; }
}

// ========== iTUNES (30s preview) ==========
async function fromItunes(query) {
    try {
        const { data } = await axios.get('https://itunes.apple.com/search', {
            params: { term: query, media: 'music', limit: 1 }, timeout: 10000
        });
        const t = data?.results?.[0];
        if (!t?.previewUrl) return null;
        const audio = await axios.get(t.previewUrl, { responseType: 'arraybuffer', timeout: 20000 });
        return {
            source: 'Deezer/iTunes Preview',
            title: t.trackName, author: t.artistName,
            duration: Math.floor(t.trackTimeMillis / 1000),
            views: 'N/A', thumbnail: t.artworkUrl100?.replace('100x100', '600x600'),
            url: t.trackViewUrl, buffer: Buffer.from(audio.data),
            mimetype: 'audio/mpeg', isAudio: true
        };
    } catch { return null; }
}

// ========== MAIN ==========
async function getAudio(query) {
    const video = await searchYoutube(query);
    if (video) {
        const full = await fromExternalYT(video);
        if (full) return full;
        console.log('[play] External API all failed, falling to preview');
    }
    return (await fromDeezer(query)) || (await fromItunes(query)) || null;
}

function formatDuration(sec) {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}
function formatViews(v) {
    if (!v || v === 'N/A') return 'N/A';
    const n = typeof v === 'string' ? parseInt(v.replace(/[^0-9]/g, '')) : v;
    if (isNaN(n)) return String(v);
    return n.toLocaleString('en-US');
}

// ========== COMMAND ==========
async function execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const query = args.join(' ').trim();
    if (!query) return sock.sendMessage(from, { text: '❌ Usage: .play <song name>' }, { quoted: msg });

    try { await sock.sendMessage(from, { react: { text: '🎵', key: msg.key } }); } catch {}

    const result = await getAudio(query);
    if (!result) {
        return sock.sendMessage(from, { text: '❌ No audio found for: ' + query }, { quoted: msg });
    }

    const isPreview = result.source.includes('Preview');
    const caption =
`╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═══⊷❍
┃✰│━━━❮❮ 🎵 ᴘʟᴀʏ ❯❯━━━━━
┃✰│ᴛɪᴛʟᴇ: ${result.title}
┃✰│ᴀʀᴛɪ𝒔ᴛ: ${result.author}
┃✰│ᴅᴜʀᴀᴛɪᴏɴ: ${formatDuration(result.duration)}
┃✰│ᴠɪᴇᴡ𝒔: ${formatViews(result.views)}
┃✰│𝒔ᴏᴜʀᴄᴇ: ${result.source}${isPreview ? ' (30s)' : ''}
┃✰│𝒔ᴛᴀᴛᴜ𝒔: ✅ ᴅᴏɴᴇ
┃✰│──────────●●►
┃✰│   ▎▍▌▌▉▏▎▌▉▐▏▌▎
┃✰│   ©𝐌𝐀𝐃𝐀𝐑𝐀 𝐗-𝐌𝐃
╰──────────────────
> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ☆ᴍᴀᴅᴀʀᴀ ɪɴᴄᴏʀᴘᴏʀᴀᴛɪᴏɴ.*`;

    await sock.sendMessage(from, {
        audio: result.buffer,
        mimetype: result.mimetype || 'audio/mpeg',
        ptt: false,
        caption: caption
    }, { quoted: msg });
}

module.exports = {
    name: 'play',
    alias: ['song', 'music', 'yt'],
    desc: 'Play music',
    category: 'media',
    execute,
    run: execute
};
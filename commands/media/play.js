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

// ========== YOUTUBE CLIENT (search only) ==========
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

// ========== HELPER: download buffer from url ==========
async function downloadBuffer(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 90000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!res.data?.length) return null;
    return Buffer.from(res.data);
}

// ========== 1. COBALT (.tools) - most stable ==========
async function fromCobalt(video) {
    try {
        const { data } = await axios.post('https://api.cobalt.tools/api/json', {
            url: `https://youtu.be/${video.videoId}`,
            isAudioOnly: true,
            aFormat: 'mp3',
            filenamePattern: 'basic'
        }, {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            timeout: 30000
        });
        const dl = data?.url;
        if (!dl) { console.log('[play] Cobalt no link'); return null; }
        const buf = await downloadBuffer(dl);
        if (!buf) return null;
        console.log('[play] Cobalt success');
        return makeResult(video, buf, 'youtube-api');
    } catch (e) {
        console.log('[play] Cobalt fail:', e.message?.slice(0, 90));
        return null;
    }
}

function makeResult(video, buf, source) {
    return {
        source,
        title: video.title,
        author: video.author,
        duration: video.duration,
        views: video.views,
        thumbnail: video.thumbnail,
        url: video.url,
        buffer: buf,
        mimetype: 'audio/mpeg',
        isAudio: true
    };
}

// ========== 2. GENERIC YTMP3 APIS - .com / .app / .xyz / .io / .net / .id ==========
async function fromExternalYT(video) {
    const ytUrl = `https://youtu.be/${video.videoId}`;
    const enc = encodeURIComponent(ytUrl);

    const apis = [
        // .com / .app / .xyz / .io / .net - try these first if .my.id is blocked
        `https://api.vevioz.com/api/button/mp3/${video.videoId}`,
        `https://api.y2mate.com/ytmp3?url=${enc}`,
        `https://api.ytmp3.app/api/download?url=${enc}`,
        `https://api.ytmp3.xyz/api/download?url=${enc}`,
        `https://api.savefrom.net/api/ytmp3?url=${enc}`,
        `https://api.cobalt.tools/api/json`, // handled separately, skip here
        // .id / .vip / .web.id - backup
        `https://api.giftedtech.web.id/api/download/ytmp3?apikey=gifted&url=${enc}`,
        `https://api.siputzx.my.id/api/dl/youtube/mp3?url=${enc}`,
        `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${enc}`,
        `https://api.princetech.my.id/api/download/ytmp3?url=${enc}`,
        `https://api.zenzxz.my.id/api/downloader/ytmp3?url=${enc}`,
        `https://api.davidcyriltech.my.id/download/ytmp3?url=${enc}`,
        `https://api.vreden.my.id/api/ytmp3?url=${enc}`,
    ];

    for (const apiUrl of apis) {
        if (apiUrl.includes('cobalt')) continue;
        try {
            const { data } = await axios.get(apiUrl, {
                timeout: 30000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const r = data?.result || data?.data || data;
            // different APIs return different shapes
            let dl = r?.download_url || r?.downloadUrl || r?.download || r?.dl || r?.url || r?.link || r?.audio || r?.mp3;
            // vevioz / some return { link: { url } }
            if (!dl && r?.link?.url) dl = r.link.url;
            if (!dl || typeof dl !== 'string' || !dl.startsWith('http')) {
                console.log('[play] External no link:', apiUrl.split('/')[2]);
                continue;
            }
            const buf = await downloadBuffer(dl);
            if (!buf) continue;
            console.log('[play] External success:', apiUrl.split('/')[2]);
            return makeResult(video, buf, 'youtube-api');
        } catch (e) {
            console.log('[play] External fail:', apiUrl.split('/')[2], e.message?.slice(0, 80));
            continue;
        }
    }
    return null;
}

// ========== 3. DEEZER (30s preview) ==========
async function fromDeezer(query) {
    try {
        const { data } = await axios.get('https://api.deezer.com/search', {
            params: { q: query }, timeout: 10000
        });
        const t = data?.data?.[0];
        if (!t?.preview) return null;
        const buf = await downloadBuffer(t.preview);
        if (!buf) return null;
        return {
            source: 'Deezer/iTunes Preview',
            title: t.title, author: t.artist?.name, duration: t.duration,
            views: 'N/A', thumbnail: t.album?.cover_xl, url: t.link,
            buffer: buf, mimetype: 'audio/mpeg', isAudio: true
        };
    } catch { return null; }
}

// ========== 4. iTUNES (30s preview) ==========
async function fromItunes(query) {
    try {
        const { data } = await axios.get('https://itunes.apple.com/search', {
            params: { term: query, media: 'music', limit: 1 }, timeout: 10000
        });
        const t = data?.results?.[0];
        if (!t?.previewUrl) return null;
        const buf = await downloadBuffer(t.previewUrl);
        if (!buf) return null;
        return {
            source: 'Deezer/iTunes Preview',
            title: t.trackName, author: t.artistName,
            duration: Math.floor(t.trackTimeMillis / 1000),
            views: 'N/A', thumbnail: t.artworkUrl100?.replace('100x100', '600x600'),
            url: t.trackViewUrl, buffer: buf,
            mimetype: 'audio/mpeg', isAudio: true
        };
    } catch { return null; }
}

// ========== 5. JIOSAAVN (.com) - full song backup ==========
async function fromSaavn(query) {
    try {
        const { data } = await axios.get('https://saavn.dev/api/search/songs', {
            params: { query }, timeout: 15000
        });
        const t = data?.data?.results?.[0];
        if (!t) return null;
        const dl = t.downloadUrl?.find(x => x.quality === '320kbps')?.url || t.downloadUrl?.[0]?.url;
        if (!dl) return null;
        const buf = await downloadBuffer(dl);
        if (!buf) return null;
        return {
            source: 'Saavn',
            title: t.name, author: t.artists?.primary?.map(a => a.name).join(', ') || 'Unknown',
            duration: t.duration, views: 'N/A',
            thumbnail: t.image?.[2]?.url, url: t.url,
            buffer: buf, mimetype: 'audio/mpeg', isAudio: true
        };
    } catch (e) {
        console.log('[play] Saavn fail:', e.message?.slice(0, 80));
        return null;
    }
}

// ========== MAIN ORDER ==========
async function getAudio(query) {
    const video = await searchYoutube(query);
    if (video) {
        // 1. Cobalt (.tools) - most stable
        const c = await fromCobalt(video);
        if (c) return c;
        // 2. All other YTMP3 APIs (.com/.app/.xyz/.io/.net/.id)
        const full = await fromExternalYT(video);
        if (full) return full;
        console.log('[play] All YT APIs failed, falling to preview/full backup');
    }
    // 3. Saavn full song
    const saavn = await fromSaavn(query);
    if (saavn) return saavn;
    // 4. Last resort 30s preview
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
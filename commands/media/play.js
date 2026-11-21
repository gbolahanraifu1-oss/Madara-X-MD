'use strict';
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execFile } = require('child_process');
const util = require('util');
const execFileAsync = util.promisify(execFile);
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
        // Netscape OR single-line cookie header
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
const HAS_COOKIE_FILE = fs.existsSync(path.join(process.cwd(), 'cookies.txt'));

// ========== YOUTUBE SEARCH (youtubei.js) ==========
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

// ========== THESYNC SEARCH FALLBACK ==========
async function searchThesync(query) {
    try {
        const { data } = await axios.get('https://apis.thesync.my.id/api/v1/search/music', {
            params: { action: 'search', q: query, filter: 'songs' },
            timeout: 12000,
            headers: { 'User-Agent': 'Madara-X-MD/1.2' }
        });
        if (!data?.success || !Array.isArray(data.data) || !data.data.length) return null;
        const t = data.data[0];
        const videoId = t.videoId || t.id;
        if (!videoId) return null;
        return {
            videoId,
            title: t.title || query,
            author: t.artist || 'Unknown',
            duration: t.duration || 0,
            views: t.plays || t.album || 'N/A',
            thumbnail: t.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            url: t.youtubeUrl || `https://youtu.be/${videoId}`,
            sourceHint: 'thesync'
        };
    } catch (e) {
        console.log('[play] thesync search fail:', e.message?.slice(0, 120));
        return null;
    }
}

function resolveYtDlpBin() {
    const local = path.join(process.cwd(), 'yt-dlp');
    if (fs.existsSync(local)) return local;
    return 'yt-dlp';
}

// ========== YT-DLP - FULL SONG (multi-client retry) ==========
async function fromYtDlp(video) {
    const outPath = path.join('/tmp', `madara_${video.videoId}.%(ext)s`);
    const finalMp3 = path.join('/tmp', `madara_${video.videoId}.mp3`);
    const bin = resolveYtDlpBin();

    // Client strategies — first success wins
    const strategies = [
        ['android', 'web'],
        ['ios', 'web'],
        ['android_music', 'android'],
        ['tv', 'web'],
        ['web'],
    ];

    for (const clients of strategies) {
        try {
            // clean previous
            for (const f of [finalMp3, path.join('/tmp', `madara_${video.videoId}.m4a`), path.join('/tmp', `madara_${video.videoId}.webm`)]) {
                try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
            }

            const args = [
                '-x',
                '--audio-format', 'mp3',
                '--audio-quality', '0',
                '--extractor-args', `youtube:player_client=${clients.join(',')}`,
                '--no-playlist',
                '--no-warnings',
                '--no-check-certificates',
                '--geo-bypass',
                '-o', outPath,
                `https://www.youtube.com/watch?v=${video.videoId}`,
            ];
            if (HAS_COOKIE_FILE) {
                args.splice(args.indexOf('-o'), 0, '--cookies', path.join(process.cwd(), 'cookies.txt'));
            }

            console.log('[play] yt-dlp try clients=', clients.join('+'), 'vid=', video.videoId);
            await execFileAsync(bin, args, {
                timeout: 150000,
                maxBuffer: 20 * 1024 * 1024,
                env: { ...process.env, PYTHONUTF8: '1' },
            });

            // Find produced audio
            let produced = null;
            for (const ext of ['mp3', 'm4a', 'webm', 'opus']) {
                const p = path.join('/tmp', `madara_${video.videoId}.${ext}`);
                if (fs.existsSync(p) && fs.statSync(p).size > 1000) {
                    produced = p;
                    break;
                }
            }
            if (!produced) {
                console.log('[play] yt-dlp no file for clients', clients.join('+'));
                continue;
            }

            const buffer = fs.readFileSync(produced);
            try { fs.unlinkSync(produced); } catch {}
            if (!buffer?.length) continue;

            console.log('[play] yt-dlp success:', (buffer.length / 1024 / 1024).toFixed(2) + 'MB', 'via', clients.join('+'));
            return {
                source: video.sourceHint === 'thesync' ? 'youtube-thesync+yt-dlp' : 'youtube-yt-dlp',
                title: video.title,
                author: video.author,
                duration: video.duration,
                views: video.views,
                thumbnail: video.thumbnail,
                url: video.url,
                buffer,
                mimetype: 'audio/mpeg',
                isAudio: true,
            };
        } catch (e) {
            const err = (e.stderr || e.message || '').toString().slice(0, 220);
            console.log('[play] yt-dlp fail', clients.join('+'), ':', err);
        }
    }
    return null;
}

// ========== COBALT-STYLE / PUBLIC FULL DOWNLOAD FALLBACKS ==========
async function fromCobaltLike(video) {
    // Try a few public yt audio endpoints that return a direct URL
    const attempts = [
        async () => {
            const { data } = await axios.post(
                'https://api.cobalt.tools/api/json',
                {
                    url: `https://www.youtube.com/watch?v=${video.videoId}`,
                    isAudioOnly: true,
                    aFormat: 'mp3',
                    filenamePattern: 'basic',
                },
                {
                    timeout: 25000,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0',
                    },
                }
            );
            const url = data?.url || data?.audio || data?.streamURL;
            if (!url) return null;
            const audio = await axios.get(url, { responseType: 'arraybuffer', timeout: 90000, maxContentLength: 40 * 1024 * 1024 });
            return Buffer.from(audio.data);
        },
        async () => {
            // savetube-style (may rotate hosts)
            const { data } = await axios.get(
                `https://api.siputzx.my.id/api/d/ytmp3?url=https://www.youtube.com/watch?v=${video.videoId}`,
                { timeout: 25000, headers: { 'User-Agent': 'Madara-X-MD/1.2' } }
            );
            const url = data?.data?.dl || data?.result?.url || data?.url || data?.download;
            if (!url) return null;
            const audio = await axios.get(url, { responseType: 'arraybuffer', timeout: 90000, maxContentLength: 40 * 1024 * 1024 });
            return Buffer.from(audio.data);
        },
    ];

    for (const fn of attempts) {
        try {
            const buffer = await fn();
            if (buffer && buffer.length > 50_000) {
                console.log('[play] full-download API success:', (buffer.length / 1024 / 1024).toFixed(2) + 'MB');
                return {
                    source: 'youtube-api+full',
                    title: video.title,
                    author: video.author,
                    duration: video.duration,
                    views: video.views,
                    thumbnail: video.thumbnail,
                    url: video.url,
                    buffer,
                    mimetype: 'audio/mpeg',
                    isAudio: true,
                };
            }
        } catch (e) {
            console.log('[play] full-download API fail:', e.message?.slice(0, 120));
        }
    }
    return null;
}

// ========== DEEZER / ITUNES 30s (last resort only) ==========
async function fromDeezer(query) {
    try {
        const { data } = await axios.get('https://api.deezer.com/search', {
            params: { q: query }, timeout: 10000
        });
        const t = data?.data?.[0];
        if (!t?.preview) return null;
        const audio = await axios.get(t.preview, { responseType: 'arraybuffer', timeout: 20000 });
        return {
            source: 'Deezer Preview',
            title: t.title, author: t.artist?.name, duration: t.duration,
            views: 'N/A', thumbnail: t.album?.cover_xl, url: t.link,
            buffer: Buffer.from(audio.data), mimetype: 'audio/mpeg', isAudio: true
        };
    } catch { return null; }
}

async function fromItunes(query) {
    try {
        const { data } = await axios.get('https://itunes.apple.com/search', {
            params: { term: query, media: 'music', limit: 1 }, timeout: 10000
        });
        const t = data?.results?.[0];
        if (!t?.previewUrl) return null;
        const audio = await axios.get(t.previewUrl, { responseType: 'arraybuffer', timeout: 20000 });
        return {
            source: 'iTunes Preview',
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
    let video = await searchYoutube(query);
    if (!video) {
        console.log('[play] falling to thesync search');
        video = await searchThesync(query);
    }

    if (video) {
        // 1) yt-dlp multi-client
        const full = await fromYtDlp(video);
        if (full) return full;

        // 2) public full download APIs
        console.log('[play] yt-dlp failed, trying full download APIs');
        const apiFull = await fromCobaltLike(video);
        if (apiFull) return apiFull;
    }

    console.log('[play] all full sources failed → 30s preview');
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

    // soft status so user knows it's working (full downloads take longer)
    let statusMsg = null;
    try {
        statusMsg = await sock.sendMessage(from, { text: '⏳ Searching & downloading full track…' }, { quoted: msg });
    } catch {}

    const result = await getAudio(query);
    if (!result) {
        if (statusMsg?.key) {
            try { await sock.sendMessage(from, { delete: statusMsg.key }); } catch {}
        }
        return sock.sendMessage(from, { text: '❌ No audio found for: ' + query }, { quoted: msg });
    }

    const isPreview = /preview/i.test(result.source);
    const caption =
`╭═══〘 𝑴𝑨𝑫𝑨𝑹𝑨 𝑿-𝑴𝑫 〙═══⊷❍
┃✰│━━━❮❮ 🎵 ᴘʟᴀʏ ❯❯━━━━━
┃✰│ᴛɪᴛʟᴇ: ${result.title}
┃✰│ᴀʀᴛɪ𝒔ᴛ: ${result.author}
┃✰│ᴅᴜʀᴀᴛɪᴏɴ: ${formatDuration(result.duration)}
┃✰│ᴠɪᴇᴡꜱ: ${formatViews(result.views)}
┃✰│ꜱᴏᴜʀᴄᴇ: ${result.source}${isPreview ? ' (30s)' : ' (full)'}
┃✰│ꜱᴛᴀᴛᴜꜱ: ✅ ᴅᴏɴᴇ
┃✰│──────────●●►
┃✰│   ▎0▌▌▉▏▎▌▉▐▏▌▎
┃✰│   ©𝐌𝐀𝐃𝐀𝐑𝐀 𝐗-𝐌𝐃
╰──────────────────
> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ☆ᴍᴀᴅᴀʀᴀ ɪɴᴄᴏʀᴘᴏʀᴀᴛɪᴏɴ.*`;

    if (statusMsg?.key) {
        try { await sock.sendMessage(from, { delete: statusMsg.key }); } catch {}
    }

    // Prefer document-style audio with filename so WA shows full length cleanly
    await sock.sendMessage(from, {
        audio: result.buffer,
        mimetype: result.mimetype || 'audio/mpeg',
        ptt: false,
        fileName: `${String(result.title || 'track').replace(/[^\w\s-]/g, '').slice(0, 40)}.mp3`,
        caption,
        contextInfo: result.thumbnail ? {
            externalAdReply: {
                title: String(result.title).slice(0, 60),
                body: String(result.author || '').slice(0, 40),
                mediaType: 1,
                thumbnailUrl: result.thumbnail,
                sourceUrl: result.url || undefined,
                renderLargerThumbnail: true,
            }
        } : undefined,
    }, { quoted: msg });
}

module.exports = {
    name: 'play',
    alias: ['song', 'music', 'yt'],
    desc: 'Play music (full track)',
    category: 'media',
    execute,
    run: execute
};

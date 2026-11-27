// language: JavaScript, file: commands/media/play.js
'use strict';
/*
 * MADARA X-MD — .play (full track)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const axios = require('axios');
const { execFile } = require('child_process');
const util = require('util');
const execFileAsync = util.promisify(execFile);

const ROOT = process.cwd();
const TMP = os.tmpdir();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const MAX_AUDIO_BYTES = 40 * 1024 * 1024;
const COOKIES_TXT = path.join(ROOT, 'cookies.txt');

// ========== COOKIES (yt-dlp needs a Netscape file) ==========
function prepareCookieFile() {
    try {
        let raw = '';
        if (fs.existsSync(COOKIES_TXT)) raw = fs.readFileSync(COOKIES_TXT, 'utf8').replace(/\r/g, '').trim();
        const out = path.join(TMP, 'madara_yt_cookies.txt');

        if (raw && raw.split('\n').some(l => l.split('\t').length >= 7)) {
            const body = /^#\s*(HTTP|Netscape)/i.test(raw) ? raw : '# Netscape HTTP Cookie File\n' + raw;
            fs.writeFileSync(out, body + '\n');
            return out;
        }

        const header = (process.env.YT_COOKIES || raw).trim();
        if (!header.includes('=')) return null;
        const rows = header.split(';')
            .map(s => s.trim())
            .filter(s => s.includes('='))
            .map(s => {
                const i = s.indexOf('=');
                return `.youtube.com\tTRUE\t/\tTRUE\t2147483647\t${s.slice(0, i)}\t${s.slice(i + 1)}`;
            });
        if (!rows.length) return null;
        fs.writeFileSync(out, '# Netscape HTTP Cookie File\n' + rows.join('\n') + '\n');
        return out;
    } catch (e) {
        console.log('[play] cookie prepare fail:', e.message);
        return null;
    }
}

// ========== yt-dlp BINARY ==========
const UPDATE_EVERY_MS = 12 * 3600 * 1000;
let ytdlpBin = null;
let ytdlpInit = null;
let ytdlpInitAt = 0;

function findYtDlp() {
    const candidates = [
        process.env.YTDLP_PATH,
        path.join(ROOT, 'yt-dlp'),
        path.join(ROOT, 'node_modules', 'yt-dlp-exec', 'bin', 'yt-dlp'),
        path.join(ROOT, 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp'),
    ].filter(Boolean);
    for (const c of candidates) {
        try { if (fs.existsSync(c) && fs.statSync(c).size > 100000) return c; } catch {}
    }
    return null;
}

async function downloadYtDlp() {
    if (process.platform !== 'linux') return null;
    const asset = process.arch === 'arm64' ? 'yt-dlp_linux_aarch64' : 'yt-dlp_linux';
    const dest = path.join(ROOT, 'yt-dlp');
    const { data } = await axios.get(`https://github.com/yt-dlp/yt-dlp/releases/latest/download/${asset}`, {
        responseType: 'arraybuffer', timeout: 120000, maxRedirects: 5, headers: { 'User-Agent': UA },
    });
    fs.writeFileSync(dest, Buffer.from(data));
    fs.chmodSync(dest, 0o755);
    return dest;
}

async function ensureYtDlp() {
    if (!ytdlpBin) {
        ytdlpBin = findYtDlp();
        if (!ytdlpBin) {
            try { await execFileAsync('yt-dlp', ['--version'], { timeout: 15000 }); ytdlpBin = 'yt-dlp'; } catch {}
        }
        if (!ytdlpBin) {
            try {
                console.log('[play] yt-dlp not found, downloading latest binary…');
                ytdlpBin = await downloadYtDlp();
            } catch (e) {
                console.log('[play] yt-dlp download failed:', e.message?.slice(0, 120));
            }
        }
    }
    if (ytdlpBin) {
        try {
            const { stdout } = await execFileAsync(ytdlpBin, ['-U'], { timeout: 45000 });
            console.log('[play] yt-dlp:', String(stdout).trim().split('\n').pop());
        } catch (e) {
            console.log('[play] yt-dlp update skipped:', String(e.stderr || e.message || '').trim().split('\n').pop()?.slice(0, 120));
        }
    }
    return ytdlpBin;
}

function getYtDlp() {
    if (!ytdlpInit || Date.now() - ytdlpInitAt > UPDATE_EVERY_MS) {
        ytdlpInitAt = Date.now();
        ytdlpInit = ensureYtDlp();
    }
    return ytdlpInit;
}

let ffmpegResolved;
async function getFfmpeg() {
    if (ffmpegResolved !== undefined) return ffmpegResolved;
    try {
        const p = require('ffmpeg-static');
        if (p && fs.existsSync(p)) return (ffmpegResolved = p);
    } catch {}
    try {
        await execFileAsync('ffmpeg', ['-version'], { timeout: 10000 });
        return (ffmpegResolved = 'ffmpeg');
    } catch {}
    return (ffmpegResolved = null);
}

const JS_FLAGS = ['--js-runtimes', `node:${process.execPath}`, '--remote-components', 'ejs:github'];

function runYtDlp(bin, args, timeout) {
    return execFileAsync(bin, args, {
        timeout,
        maxBuffer: 50 * 1024 * 1024,
        env: { ...process.env, PYTHONUTF8: '1' },
    });
}

async function ytdlp(bin, args, timeout) {
    try {
        return await runYtDlp(bin, [...JS_FLAGS, ...args], timeout);
    } catch (e) {
        const err = String(e.stderr || e.message || '');
        if (/no such option|unrecognized arguments|unknown option/i.test(err)) {
            return runYtDlp(bin, args, timeout);
        }
        throw e;
    }
}

// ========== SEARCH ==========
async function searchYtSearch(query) {
    try {
        const yts = require('yt-search');
        const r = await yts(query);
        const v = r?.videos?.[0];
        if (!v?.videoId) return null;
        return {
            videoId: v.videoId,
            title: v.title || query,
            author: v.author?.name || 'Unknown',
            duration: v.seconds || 0,
            views: v.views || 0,
            thumbnail: v.thumbnail || v.image || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
            url: `https://youtu.be/${v.videoId}`,
        };
    } catch (e) { return null; }
}

let ytClient = null;
async function searchYoutubei(query) {
    try {
        const { Innertube, UniversalCache } = require('youtubei.js');
        if (!ytClient) ytClient = await Innertube.create({ cache: new UniversalCache(false), generate_session_locally: true });
        const search = await ytClient.search(query, { type: 'video' });
        const v = (search.results || []).find(r => r && r.type === 'Video' && r.id);
        if (!v) return null;
        return {
            videoId: v.id,
            title: v.title?.text || String(v.title || query),
            author: v.author?.name || 'Unknown',
            duration: v.duration?.seconds || 0,
            views: v.view_count?.text || 0,
            thumbnail: v.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
            url: `https://youtu.be/${v.id}`,
        };
    } catch (e) { ytClient = null; return null; }
}

async function searchThesync(query) {
    try {
        const { data } = await axios.get('https://apis.thesync.my.id/api/v1/search/music', {
            params: { action: 'search', q: query, filter: 'songs' },
            timeout: 12000, headers: { 'User-Agent': 'Madara-X-MD/1.2' },
        });
        if (!data?.success || !Array.isArray(data.data) || !data.data.length) return null;
        const t = data.data[0];
        const videoId = t.videoId || t.id;
        if (!videoId) return null;
        return {
            videoId, title: t.title || query, author: t.artist || 'Unknown',
            duration: t.duration || 0, views: t.plays || t.album || 'N/A',
            thumbnail: t.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            url: t.youtubeUrl || `https://youtu.be/${videoId}`,
        };
    } catch (e) { return null; }
}

async function searchYtDlp(query) {
    try {
        const bin = await getYtDlp();
        if (!bin) return null;
        const { stdout } = await ytdlp(bin, ['--no-warnings', '--flat-playlist', '--dump-single-json', `ytsearch1:${query}`], 45000);
        const e = JSON.parse(stdout)?.entries?.[0];
        if (!e?.id) return null;
        return {
            videoId: e.id, title: e.title || query, author: e.uploader || e.channel || 'Unknown',
            duration: e.duration || 0, views: e.view_count || 0,
            thumbnail: e.thumbnails?.[e.thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${e.id}/hqdefault.jpg`,
            url: `https://youtu.be/${e.id}`,
        };
    } catch (e) { return null; }
}

async function searchVideo(query) {
    for (const fn of [searchYtSearch, searchYoutubei, searchThesync, searchYtDlp]) {
        const v = await fn(query);
        if (v) return v;
    }
    return null;
}

// ========== yt-dlp DOWNLOAD ==========
const PRODUCED_EXTS = ['mp3', 'm4a', 'webm', 'opus', 'ogg'];
const MIME_BY_EXT = { mp3: 'audio/mpeg', m4a: 'audio/mp4', webm: 'audio/ogg; codecs=opus', opus: 'audio/ogg; codecs=opus', ogg: 'audio/ogg; codecs=opus' };

function cleanupTmp(videoId) {
    for (const ext of PRODUCED_EXTS.concat(['part', 'ytdl'])) {
        try { fs.unlinkSync(path.join(TMP, `madara_${videoId}.${ext}`)); } catch {}
    }
}

async function fromYtDlp(video) {
    const bin = await getYtDlp();
    if (!bin) { console.log('[play] no yt-dlp binary available'); return null; }

    const ffmpeg = await getFfmpeg();
    let ffmpegBroken = false;
    const cookieFile = prepareCookieFile();
    const outTpl = path.join(TMP, `madara_${video.videoId}.%(ext)s`);

    const strategies = [
        { client: null, cookies: true },
        { client: null, cookies: false },
        { client: 'android_vr', cookies: false },
        { client: 'tv', cookies: true },
        { client: 'web_safari', cookies: true },
    ];
    const seen = new Set();

    for (const st of strategies) {
        const useCookies = Boolean(st.cookies && cookieFile);
        const key = `${st.client}|${useCookies}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const useFfmpeg = Boolean(ffmpeg) && !ffmpegBroken;
        cleanupTmp(video.videoId);

        const args = ['--no-playlist', '--no-warnings', '--no-check-certificates', '--geo-bypass', '--socket-timeout', '20', '--retries', '2', '-o', outTpl];
        if (useFfmpeg) {
            if (path.isAbsolute(ffmpeg)) args.push('--ffmpeg-location', ffmpeg);
            args.push('-f', 'bestaudio/best', '-x', '--audio-format', 'mp3', '--audio-quality', '0');
        } else {
            args.push('-f', 'bestaudio[ext=m4a]/bestaudio');
        }
        if (st.client) args.push('--extractor-args', `youtube:player_client=${st.client}`);
        if (useCookies) args.push('--cookies', cookieFile);
        if (process.env.YTDLP_PROXY) args.push('--proxy', process.env.YTDLP_PROXY);
        args.push(`https://www.youtube.com/watch?v=${video.videoId}`);

        const label = `${st.client || 'default'}${useCookies ? '+cookies' : ''}`;
        try {
            console.log('[play] yt-dlp try', label, 'vid=', video.videoId);
            await ytdlp(bin, args, 150000);

            let produced = null, ext = null;
            for (const e of PRODUCED_EXTS) {
                const p = path.join(TMP, `madara_${video.videoId}.${e}`);
                if (fs.existsSync(p) && fs.statSync(p).size > 1000) { produced = p; ext = e; break; }
            }
            if (!produced) continue;

            const buffer = fs.readFileSync(produced);
            cleanupTmp(video.videoId);
            if (!buffer.length) continue;

            console.log('[play] yt-dlp success:', (buffer.length / 1024 / 1024).toFixed(2) + 'MB via', label);
            return {
                source: 'youtube-yt-dlp', title: video.title, author: video.author, duration: video.duration,
                views: video.views, thumbnail: video.thumbnail, url: video.url,
                buffer, ext, mimetype: MIME_BY_EXT[ext] || 'audio/mpeg', isAudio: true,
            };
        } catch (e) {
            const err = String(e.stderr || e.message || '').trim();
            console.log('[play] yt-dlp fail', label, ':', err.split('\n').slice(-2).join(' | ').slice(0, 260));
            if (/ffmpeg|ffprobe/i.test(err) && /not found|not installed|requires/i.test(err)) ffmpegBroken = true;
        }
    }
    cleanupTmp(video.videoId);
    return null;
}

// ========== API FALLBACKS ==========
async function downloadBuffer(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 90000, maxContentLength: MAX_AUDIO_BYTES, headers: { 'User-Agent': UA } });
    return Buffer.from(res.data);
}

async function fromApis(video) {
    const ytUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    const attempts = [];

    if (process.env.COBALT_API_URL) {
        attempts.push(async () => {
            const headers = { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': UA };
            if (process.env.COBALT_API_KEY) headers.Authorization = `Api-Key ${process.env.COBALT_API_KEY}`;
            const { data } = await axios.post(process.env.COBALT_API_URL, { url: ytUrl, downloadMode: 'audio', audioFormat: 'mp3' }, { timeout: 30000, headers });
            if (!['tunnel', 'redirect'].includes(data?.status) || !data.url) return null;
            return downloadBuffer(data.url);
        });
    }

    // 1. Ryzendesu API
    attempts.push(async () => {
        const { data } = await axios.get(`https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(ytUrl)}`, { timeout: 25000 });
        const url = data?.data?.url || data?.result?.url || data?.url;
        return url ? downloadBuffer(url) : null;
    });

    // 2. Nexoracle API
    attempts.push(async () => {
        const { data } = await axios.get(`https://api.nexoracle.com/downloader/ytmp3?url=${encodeURIComponent(ytUrl)}`, { timeout: 25000 });
        const url = data?.result?.url || data?.result?.download || data?.url;
        return url ? downloadBuffer(url) : null;
    });

    // 3. Siputzx API
    attempts.push(async () => {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(ytUrl)}`, { timeout: 25000 });
        const url = data?.data?.dl || data?.result?.url || data?.url || data?.download;
        return url ? downloadBuffer(url) : null;
    });

    for (const fn of attempts) {
        try {
            const buffer = await fn();
            if (buffer && buffer.length > 50_000) {
                console.log('[play] API download success:', (buffer.length / 1024 / 1024).toFixed(2) + 'MB');
                return {
                    source: 'youtube-api', title: video.title, author: video.author, duration: video.duration,
                    views: video.views, thumbnail: video.thumbnail, url: video.url,
                    buffer, ext: 'mp3', mimetype: 'audio/mpeg', isAudio: true,
                };
            }
        } catch (e) { console.log('[play] API download fail:', e.message?.slice(0, 120)); }
    }
    return null;
}

// ========== DEEZER / ITUNES 30s ==========
async function fromDeezer(query) {
    try {
        const { data } = await axios.get('https://api.deezer.com/search', { params: { q: query }, timeout: 10000 });
        const t = data?.data?.[0];
        if (!t?.preview) return null;
        const audio = await axios.get(t.preview, { responseType: 'arraybuffer', timeout: 20000 });
        return {
            source: 'Deezer Preview', title: t.title, author: t.artist?.name, duration: t.duration,
            views: 'N/A', thumbnail: t.album?.cover_xl, url: t.link,
            buffer: Buffer.from(audio.data), ext: 'mp3', mimetype: 'audio/mpeg', isAudio: true,
        };
    } catch { return null; }
}

async function fromItunes(query) {
    try {
        const { data } = await axios.get('https://itunes.apple.com/search', { params: { term: query, media: 'music', limit: 1 }, timeout: 10000 });
        const t = data?.results?.[0];
        if (!t?.previewUrl) return null;
        const audio = await axios.get(t.previewUrl, { responseType: 'arraybuffer', timeout: 20000 });
        return {
            source: 'iTunes Preview', title: t.trackName, author: t.artistName,
            duration: Math.floor(t.trackTimeMillis / 1000),
            views: 'N/A', thumbnail: t.artworkUrl100?.replace('100x100', '600x600'),
            url: t.trackViewUrl, buffer: Buffer.from(audio.data),
            ext: 'm4a', mimetype: 'audio/mp4', isAudio: true,
        };
    } catch { return null; }
}

// ========== MAIN ==========
async function getAudio(query) {
    const video = await searchVideo(query);
    if (video) {
        const full = await fromYtDlp(video);
        if (full) return full;
        console.log('[play] yt-dlp failed, trying API downloads');
        const apiFull = await fromApis(video);
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

async function execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const query = args.join(' ').trim();
    if (!query) return sock.sendMessage(from, { text: '❌ Usage: .play <song name>' }, { quoted: msg });

    try { await sock.sendMessage(from, { react: { text: '🎵', key: msg.key } }); } catch {}

    let statusMsg = null;
    try { statusMsg = await sock.sendMessage(from, { text: '⏳ Searching & downloading full track…' }, { quoted: msg }); } catch {}

    const result = await getAudio(query);
    if (statusMsg?.key) {
        try { await sock.sendMessage(from, { delete: statusMsg.key }); } catch {}
    }
    if (!result) return sock.sendMessage(from, { text: '❌ No audio found for: ' + query }, { quoted: msg });

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

    await sock.sendMessage(from, {
        audio: result.buffer,
        mimetype: result.mimetype || 'audio/mpeg',
        ptt: false,
        fileName: `${String(result.title || 'track').replace(/[^\w\s-]/g, '').slice(0, 40)}.${result.ext || 'mp3'}`,
        caption,
        contextInfo: result.thumbnail ? {
            externalAdReply: {
                title: String(result.title).slice(0, 60),
                body: String(result.author || '').slice(0, 40),
                mediaType: 1,
                thumbnailUrl: result.thumbnail,
                sourceUrl: result.url || undefined,
                renderLargerThumbnail: true,
            },
        } : undefined,
    }, { quoted: msg });
}

module.exports = {
    name: 'play',
    alias: ['song', 'music', 'yt'],
    desc: 'Play music (full track)',
    category: 'media',
    execute,
    run: execute,
};
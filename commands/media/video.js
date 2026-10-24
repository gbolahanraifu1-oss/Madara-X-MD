'use strict';

const axios = require('axios');
const yts = require('yt-search');
const { downloadBuffer } = require('../../lib/ytDlpDownload');

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const REQUEST_TIMEOUT = 60_000;

const HTTP_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
};

function isYouTubeUrl(value) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(String(value || ''));
}

function pickVideoUrl(data) {
    const roots = [data?.result, data?.data, data];
    for (const root of roots) {
        if (!root || typeof root !== 'object') continue;
        const candidates = [
            root.video,
            root.videoUrl,
            root.download,
            root.download_url,
            root.downloadUrl,
            root.dl_url,
            root.url,
            root.result?.video,
            root.result?.url,
        ];
        const found = candidates.find(value => typeof value === 'string' && /^https?:\/\//i.test(value));
        if (found) return found;
    }
    return null;
}

function looksLikeBotCheck(buffer) {
    const head = Buffer.from(buffer || []).subarray(0, 256 * 1024).toString('utf8').toLowerCase();
    return /sign in to confirm|confirm you're not a bot|not a bot|captcha|consent\.youtube\.com|unusual traffic/.test(head);
}

function looksLikeVideo(buffer, contentType = '') {
    const mime = String(contentType).split(';')[0].toLowerCase();
    if (mime.startsWith('video/')) return true;
    const data = Buffer.from(buffer || []);
    if (data.length >= 12 && data.slice(4, 8).toString('ascii') === 'ftyp') return true;
    if (data.length >= 4 && data.slice(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return true;
    if (data.length >= 12 && data.slice(0, 4).toString('ascii') === 'RIFF' && data.slice(8, 12).toString('ascii') === 'AVI ') return true;
    return false;
}

async function fetchVideoBuffer(url) {
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: REQUEST_TIMEOUT,
        maxContentLength: MAX_VIDEO_BYTES,
        maxBodyLength: MAX_VIDEO_BYTES,
        maxRedirects: 5,
        headers: HTTP_HEADERS,
        validateStatus: status => status >= 200 && status < 400,
    });
    const buffer = Buffer.from(response.data || []);
    if (looksLikeBotCheck(buffer)) throw new Error('provider returned a YouTube bot-check page');
    if (!buffer.length || buffer.length > MAX_VIDEO_BYTES) throw new Error('video is empty or larger than 50 MB');
    if (!looksLikeVideo(buffer, response.headers?.['content-type'])) throw new Error('provider returned a non-video response');
    return buffer;
}

async function downloadFromApi(videoUrl) {
    const encoded = encodeURIComponent(videoUrl);
    const providers = [
        {
            name: 'Siputzx',
            endpoint: 'https://api.siputzx.my.id/api/d/ytmp4?url=' + encoded,
        },
        {
            name: 'Vreden',
            endpoint: 'https://api.vreden.my.id/api/ytmp4?url=' + encoded,
        },
    ];

    const failures = [];
    for (const provider of providers) {
        try {
            const response = await axios.get(provider.endpoint, {
                timeout: REQUEST_TIMEOUT,
                headers: HTTP_HEADERS,
                maxRedirects: 5,
                validateStatus: status => status >= 200 && status < 400,
            });
            const link = pickVideoUrl(response.data);
            if (!link) throw new Error('no video URL in provider response');
            return { buffer: await fetchVideoBuffer(link), provider: provider.name };
        } catch (error) {
            failures.push(provider.name + ': ' + error.message);
        }
    }
    throw new Error('all video providers failed (' + failures.join('; ') + ')');
}

async function downloadWithYtDlp(videoUrl) {
    const buffer = await downloadBuffer(videoUrl, { maxBytes: MAX_VIDEO_BYTES });
    if (looksLikeBotCheck(buffer) || !looksLikeVideo(buffer, 'video/mp4')) throw new Error('yt-dlp returned a non-video response');
    return buffer;
}

async function downloadVideo(videoUrl) {
    const failures = [];
    try {
        return await downloadFromApi(videoUrl);
    } catch (error) {
        failures.push(error.message);
    }

    try {
        return { buffer: await downloadWithYtDlp(videoUrl), provider: 'yt-dlp' };
    } catch (error) {
        failures.push(error.message);
        throw new Error('YouTube download unavailable. ' + failures.join(' | '));
    }
}

module.exports = {
    name: 'video',
    aliases: ['searchvideo', 'dlvideo', 'getvideo'],
    category: 'media',
    desc: 'Search and download video by query',
    usage: '†video [query]',

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const query = args.join(' ').trim();
        if (!query) return ctx.reply('❌ Usage: ' + s.prefix + 'video [query]' + s.FOOTER);
        await ctx.react('🎬');

        try {
            let videoUrl = query;
            let title = query;
            if (!isYouTubeUrl(query)) {
                const results = await yts(query);
                const top = results.videos?.[0];
                if (!top) return ctx.reply('❌ No results for *' + query + '*.' + s.FOOTER);
                videoUrl = top.url;
                title = top.title;
            }

            const result = await downloadVideo(videoUrl);
            await sock.sendMessage(ctx.from, {
                video: result.buffer,
                mimetype: 'video/mp4',
                caption: '🎬 ' + title + s.FOOTER,
            }, { quoted: msg });
        } catch (error) {
            const message = String(error?.message || error);
            const safeMessage = message.length > 280 ? message.slice(0, 280) + '…' : message;
            await ctx.reply('❌ Video download failed: ' + safeMessage + s.FOOTER);
        }
    },
};

'use strict';

const ytdlp = require('youtube-dl-exec');

function validateAllowedUrl(raw, domains) {
    let url;
    try { url = new URL(String(raw || '')); } catch (_) { throw new Error('Provide a valid HTTPS link.'); }
    if (url.protocol !== 'https:') throw new Error('Only HTTPS links are supported.');
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    if (!domains.some(domain => hostname === domain || hostname.endsWith('.' + domain))) throw new Error('That link is not from a supported site.');
    return url.href;
}

function downloadBuffer(url, { format = 'best[ext=mp4]/best', maxBytes = 50 * 1024 * 1024, timeoutMs = 75000, audioFormat } = {}) {
    return new Promise((resolve, reject) => {
        const flags = { format, output: '-', noPlaylist: true, quiet: true, noWarnings: true, socketTimeout: 25, maxFilesize: Math.ceil(maxBytes / 1024 / 1024) + 'M' };
        if (audioFormat) { flags.extractAudio = true; flags.audioFormat = audioFormat; flags.ffmpegLocation = require('ffmpeg-static'); }
        const child = ytdlp.exec(url, flags);
        const chunks = [];
        let size = 0;
        let stderr = '';
        let settled = false;
        const finish = (error, buffer) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (error) reject(error); else resolve(buffer);
        };
        const timer = setTimeout(() => { child.kill('SIGTERM'); finish(new Error('Download timed out.')); }, timeoutMs);
        child.stdout.on('data', chunk => {
            size += chunk.length;
            if (size > maxBytes) { child.kill('SIGTERM'); return finish(new Error('File exceeds the 50 MB limit.')); }
            chunks.push(chunk);
        });
        child.stderr.on('data', chunk => { stderr = (stderr + chunk.toString()).slice(-1200); });
        child.once('error', error => finish(error));
        child.once('close', code => {
            if (code !== 0) return finish(new Error(stderr.trim().split('\n').slice(-1)[0] || 'yt-dlp could not download this link.'));
            const buffer = Buffer.concat(chunks);
            if (!buffer.length) return finish(new Error('The site returned an empty file.'));
            finish(null, buffer);
        });
    });
}

module.exports = { validateAllowedUrl, downloadBuffer };

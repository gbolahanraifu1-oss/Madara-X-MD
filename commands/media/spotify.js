'use strict';
const yts = require('yt-search');
const { validateAllowedUrl, downloadBuffer } = require('../../lib/ytDlpDownload');
module.exports = {
    name: 'spotify', aliases: ['spotdl', 'spotifydownload'], category: 'media',
    desc: 'Find and download a track by title (searches YouTube)', usage: '†spotify <track title>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args.join(' ').trim();
        if (!q) return ctx.reply('❌ ' + s.prefix + 'spotify Shape of You' + s.FOOTER);
        await ctx.react('⏳');
        try {
            const found = await yts(q);
            const track = found.videos?.[0];
            if (!track?.url) throw new Error('No matching track found.');
            const url = validateAllowedUrl(track.url, ['youtube.com', 'youtu.be']);
            const audio = await downloadBuffer(url, { format: 'bestaudio/best', audioFormat: 'mp3', maxBytes: 25 * 1024 * 1024 });
            return sock.sendMessage(ctx.from, { audio, mimetype: 'audio/mpeg', fileName: track.title.slice(0, 70) + '.mp3', caption: '🎵 ' + track.title + ' (YouTube search)' + s.FOOTER }, { quoted: msg });
        } catch (error) { return ctx.reply('❌ Track download failed: ' + String(error.message || error).slice(0, 160) + s.FOOTER); }
    },
};
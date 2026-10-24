'use strict';
const { validateAllowedUrl, downloadBuffer } = require('../../lib/ytDlpDownload');
module.exports = {
    name: 'ytmp4', aliases: ['videodl', 'yt', 'ytdl'], category: 'media',
    desc: 'Download a YouTube video', usage: '†ytmp4 <url>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        if (!args[0]) return ctx.reply('❌ Provide a YouTube URL.' + s.FOOTER);
        await ctx.react('⏳');
        try {
            const url = validateAllowedUrl(args[0], ['youtube.com', 'youtu.be']);
            const video = await downloadBuffer(url, { format: 'best[ext=mp4]/best' });
            return sock.sendMessage(ctx.from, { video, mimetype: 'video/mp4', caption: '📹 YouTube video' + s.FOOTER }, { quoted: msg });
        } catch (error) { return ctx.reply('❌ Video download failed: ' + String(error.message || error).slice(0, 180) + s.FOOTER); }
    },
};
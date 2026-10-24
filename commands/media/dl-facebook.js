'use strict';
const { validateAllowedUrl, downloadBuffer } = require('../../lib/ytDlpDownload');
module.exports = {
    name: 'facebook', aliases: ['fb', 'fbdl', 'fbvideo'], category: 'media',
    desc: 'Download a public Facebook video', usage: '†facebook <url>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        if (!args[0]) return ctx.reply('❌ Usage: ' + s.prefix + 'facebook <url>' + s.FOOTER);
        await ctx.react('⏳');
        try {
            const url = validateAllowedUrl(args[0], ['facebook.com', 'fb.watch']);
            const video = await downloadBuffer(url, { format: 'best[ext=mp4]/best' });
            return sock.sendMessage(ctx.from, { video, mimetype: 'video/mp4', caption: '📘 Facebook video' + s.FOOTER }, { quoted: msg });
        } catch (error) { return ctx.reply('❌ Download failed: ' + String(error.message || error).slice(0, 160) + s.FOOTER); }
    },
};
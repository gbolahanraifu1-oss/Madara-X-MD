'use strict';
const { validateAllowedUrl, downloadBuffer } = require('../../lib/ytDlpDownload');
module.exports = {
    name: 'xvideos', aliases: ['xvid', 'xvideo'], category: 'misc',
    desc: 'Download a direct public Xvideos link (18+)', usage: '†xvideos <Xvideos URL>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        if (!args[0]) return ctx.reply('❌ Usage: ' + s.prefix + 'xvideos <Xvideos URL>' + s.FOOTER);
        try {
            const url = validateAllowedUrl(args[0], ['xvideos.com']);
            const video = await downloadBuffer(url, { format: 'best[ext=mp4]/best' });
            return sock.sendMessage(ctx.from, { video, mimetype: 'video/mp4', caption: '🎥 Xvideos clip' + s.FOOTER }, { quoted: msg });
        } catch (error) { return ctx.reply('❌ Download failed: ' + String(error.message || error).slice(0, 160) + s.FOOTER); }
    },
};
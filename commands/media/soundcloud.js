'use strict';
const play = require('play-dl');
const { validateAllowedUrl, downloadBuffer } = require('../../lib/ytDlpDownload');
module.exports = {
    name: 'soundcloud', aliases: ['scdl', 'sc'], category: 'media',
    desc: 'Download audio from SoundCloud', usage: '†soundcloud <url or title>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const query = args.join(' ').trim();
        if (!query) return ctx.reply('❌ ' + s.prefix + 'soundcloud Alone' + s.FOOTER);
        await ctx.react('⏳');
        try {
            let url;
            let title = query;
            if (/^https?:\/\//i.test(query)) {
                url = validateAllowedUrl(query, ['soundcloud.com']);
            } else {
                const results = await play.search(query, { source: { soundcloud: 'tracks' }, limit: 1 });
                const track = results?.[0];
                if (!track?.url) throw new Error('No SoundCloud track found.');
                url = validateAllowedUrl(track.url, ['soundcloud.com']);
                title = track.name || query;
            }
            const audio = await downloadBuffer(url, { format: 'bestaudio/best', audioFormat: 'mp3', maxBytes: 25 * 1024 * 1024 });
            return sock.sendMessage(ctx.from, { audio, mimetype: 'audio/mpeg', fileName: title.slice(0, 70) + '.mp3', caption: '☁️ ' + title + s.FOOTER }, { quoted: msg });
        } catch (error) { return ctx.reply('❌ SoundCloud download failed: ' + String(error.message || error).slice(0, 160) + s.FOOTER); }
    },
};
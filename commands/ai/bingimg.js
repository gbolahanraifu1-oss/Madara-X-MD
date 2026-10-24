'use strict';
const { searchCommonsImages } = require('../../lib/apiReplacements');
module.exports = {
    name: 'bing', aliases: ['bingimage', 'bingai'], category: 'ai',
    desc: 'Search Wikimedia Commons images', usage: '†bing <query>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args.join(' ').trim();
        if (!q) return ctx.reply('❌ *ᴜsᴀɢᴇ:* ' + s.prefix + 'bing anime wallpaper' + s.FOOTER);
        await ctx.react('⏳');
        try {
            const images = await searchCommonsImages(q, 4);
            if (!images.length) return ctx.reply('❌ No Wikimedia images found for ' + q + '.' + s.FOOTER);
            for (const image of images) await sock.sendMessage(ctx.from, { image: { url: image.url }, caption: '🔍 ' + image.title + '\n' + q + s.FOOTER }, { quoted: msg });
        } catch (error) { return ctx.reply('❌ Image search is temporarily unavailable.' + s.FOOTER); }
    },
};
'use strict';
const { searchStickerPacks } = require('../../lib/apiReplacements');
module.exports = {
    name: 'sticker2', aliases: ['stickerpack', 'tgpack'], category: 'search',
    desc: 'Search WhatsApp sticker packs', usage: '†sticker2 <query>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args.join(' ').trim() || 'anime';
        try {
            const packs = await searchStickerPacks(q, 5);
            if (!packs.length) return ctx.reply('❌ No sticker packs found for ' + q + '.' + s.FOOTER);
            return ctx.reply('🎨 Sticker packs for ' + q + ':\n\n' + packs.map((p, i) => (i + 1) + '. ' + p.name + '\n🔗 ' + p.link).join('\n\n') + s.FOOTER);
        } catch (error) { return ctx.reply('❌ Sticker search is unavailable: ' + String(error.message || error).slice(0, 120) + s.FOOTER); }
    },
};
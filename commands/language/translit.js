'use strict';
const { transliterate } = require('../../lib/apiReplacements');
module.exports = {
    name: 'translit', aliases: ['romanize', 'latinize'], category: 'language',
    desc: 'Romanize text using Google Translate', usage: '†translit <text>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const text = args.join(' ').trim();
        if (!text) return ctx.reply('❌ ' + s.prefix + 'translit Привет' + s.FOOTER);
        try {
            const result = await transliterate(text);
            if (!result) return ctx.reply('❌ Romanization is not available for this text.' + s.FOOTER);
            return ctx.reply('🔤 Transliteration: ' + result + s.FOOTER);
        } catch (error) { return ctx.reply('❌ Transliteration is temporarily unavailable.' + s.FOOTER); }
    },
};
'use strict';
const { detectLanguage } = require('../../lib/apiReplacements');
module.exports = {
    name: 'detect', aliases: ['langdetect', 'whatlang'], category: 'language',
    desc: 'Detect the language of text', usage: '†detect <text>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const text = args.join(' ').trim();
        if (!text) return ctx.reply('❌ ' + s.prefix + 'detect Bonjour' + s.FOOTER);
        try {
            const result = await detectLanguage(text);
            if (!result) return ctx.reply('❌ Language could not be detected.' + s.FOOTER);
            return ctx.reply('🌐 Detected: ' + result.name + ' (' + result.code + ')' + s.FOOTER);
        } catch (error) { return ctx.reply('❌ Language detection is temporarily unavailable.' + s.FOOTER); }
    },
};
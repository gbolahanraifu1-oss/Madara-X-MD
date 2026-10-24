'use strict';
const { ask } = require('../../utils/smartAI');
module.exports = {
    name: 'paraphrase', aliases: ['rephrase', 'rewrite'], category: 'misc',
    desc: 'Rewrite text with the configured AI provider', usage: '†paraphrase <text>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const text = args.join(' ').trim();
        if (!text) return ctx.reply('❌ Provide text to rewrite.' + s.FOOTER);
        await ctx.react('⏳');
        try {
            const result = await ask({ system: 'Rewrite the user text naturally while preserving its exact meaning and language. Return only the rewritten text.', user: text, remember: false });
            if (!result) return ctx.reply('❌ AI is busy or not configured. Try again later.' + s.FOOTER);
            return ctx.reply('✏️ Rewritten\n\n' + result + s.FOOTER);
        } catch (error) { return ctx.reply('❌ AI rewrite is unavailable. Check the configured AI provider.' + s.FOOTER); }
    },
};
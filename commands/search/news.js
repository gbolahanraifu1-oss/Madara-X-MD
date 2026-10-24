'use strict';
const { searchNews } = require('../../lib/apiReplacements');
module.exports = {
    name: 'news', aliases: ['latestnews', 'headlines'], category: 'search',
    desc: 'Get latest news headlines', usage: '†news [topic]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args.join(' ').trim() || 'technology';
        try {
            const items = await searchNews(q, 5);
            if (!items.length) return ctx.reply('❌ No headlines found for ' + q + '.' + s.FOOTER);
            const lines = items.map((item, i) => (i + 1) + '. *' + item.title.slice(0, 120) + '*\n🔗 ' + item.link).join('\n\n');
            return ctx.reply('📰 Latest news: ' + q + '\n\n' + lines + s.FOOTER);
        } catch (error) { return ctx.reply('❌ News is temporarily unavailable.' + s.FOOTER); }
    },
};
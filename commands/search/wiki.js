const axios = require('axios');
module.exports = {
    name: 'wiki',
    aliases: ['wikipedia', 'wikisearch'],
    category: 'search',
    desc: 'Search Wikipedia',
    usage: '†wiki [topic]',
    async execute(sock, msg, args, ctx) {
        const s     = ctx.settings;
        const query = ctx.text;
        if (!query) return ctx.reply(`❌ Provide a topic.${s.FOOTER}`);
        await ctx.react('📖');
        try {
            const res = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
            const d   = res.data;
            ctx.reply(`📖 *${d.title}*\n\n${d.extract?.slice(0,1000) || 'No summary available.'}${d.extract?.length>1000?'...':''}\n\n🔗 ${d.content_urls?.desktop?.page||''}${s.FOOTER}`);
        } catch { ctx.reply(`❌ No Wikipedia article found for *${query}*.${s.FOOTER}`); }
    }
};

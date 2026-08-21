const axios = require('axios');
const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'newsfinance',
    aliases: ['financenews', 'marketnews', 'cryptonews'],
    category: 'finance',
    desc: 'Get latest finance and crypto news',
    usage: '†newsfinance [topic]',
    async execute(sock, msg, args, ctx) {
        const s     = ctx.settings;
        const topic = ctx.text || 'crypto finance';
        await ctx.react('📰');
        try {
            const res   = await axios.get(`https://api.siputzx.my.id/api/s/googlenews?q=${encodeURIComponent(topic + ' market news today')}`);
            const items = res.data?.data?.slice(0, 6) || [];
            if (!items.length) throw new Error('No news');
            const lines = [];
            items.forEach((n, i) => {
                lines.push(`*${i + 1}.* ${n.title || n.name}`);
                if (n.link || n.url) lines.push(`     🔗 ${n.link || n.url}`);
            });
            ctx.reply(menuBox('💹', `ɴᴇᴡs: ${topic}`, lines) + s.FOOTER);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

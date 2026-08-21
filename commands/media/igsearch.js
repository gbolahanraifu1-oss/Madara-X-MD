const axios = require('axios');
module.exports = {
    name: 'igsearch',
    aliases: ['igs','instasearch'],
    category: 'media',
    desc: 'Search Instagram',
    usage: '†igsearch [query]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args.join(' ');
        if (!q) return ctx.reply(`❌ Usage: \`${s.prefix}igsearch [query]\`${s.FOOTER}`);
        await ctx.react('🔍');
        try {
            const res  = await axios.get(`https://api.siputzx.my.id/api/s/instagram?q=${encodeURIComponent(q)}`);
            const data = res.data?.data;
            if (!data?.length) return ctx.reply(`❌ No results for *${q}*${s.FOOTER}`);
            const top  = data[0];
            ctx.reply(`🔍 *Instagram Search: "${q}"*\n\n*Title:* ${top.title||top.name||'N/A'}\n*URL:* ${top.url||top.link||'N/A'}\n\nUse URL with download command.${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Search failed: ${e.message}${s.FOOTER}`); }
    }
};

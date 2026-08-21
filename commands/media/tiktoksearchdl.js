const axios = require('axios');
module.exports = {
    name: 'tiktoksearchdl',
    aliases: ['ttsearchdl'],
    category: 'media',
    desc: 'TikTok search+dl',
    usage: '†tiktoksearchdl [query]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args.join(' ');
        if (!q) return ctx.reply(`❌ Usage: \`${s.prefix}tiktoksearchdl [query]\`${s.FOOTER}`);
        await ctx.react('🔍');
        try {
            const res  = await axios.get(`https://api.siputzx.my.id/api/s/tiktok?q=${encodeURIComponent(q)}`);
            const data = res.data?.data;
            if (!data?.length) return ctx.reply(`❌ No results for *${q}*${s.FOOTER}`);
            const top  = data[0];
            ctx.reply(`🔍 *TikTok Search: "${q}"*\n\n*Title:* ${top.title||top.name||'N/A'}\n*URL:* ${top.url||top.link||'N/A'}\n\nUse URL with download command.${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Search failed: ${e.message}${s.FOOTER}`); }
    }
};

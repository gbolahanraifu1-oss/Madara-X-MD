const axios = require('axios');
module.exports = {
    name: 'stickersearch',
    aliases: ['searchsticker', 'findstickerpack'],
    category: 'sticker',
    desc: 'Search for sticker packs by keyword',
    usage: '†stickersearch [keyword]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args.join(' ');
        if (!q) return ctx.reply(`❌ Usage: \`${s.prefix}stickersearch [keyword]\`${s.FOOTER}`);
        await ctx.react('🔍');
        try {
            const res  = await axios.get(`https://api.siputzx.my.id/api/s/sticker?q=${encodeURIComponent(q)}`);
            const data = res.data?.data;
            if (!data?.length) return ctx.reply(`❌ No sticker packs found for *${q}*.${s.FOOTER}`);
            const list = data.slice(0,5).map((p,i) => `${i+1}. *${p.name||'Pack'}*${p.author?` by _${p.author}_`:''}`).join('\n');
            ctx.reply(`🔍 *Sticker Packs for "${q}":*\n\n${list}${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Search failed: ${e.message}${s.FOOTER}`); }
    }
};

const axios = require('axios');
module.exports = { name: 'detik', aliases: ['detiknews','detiksearch','berita'], category: 'search', desc: 'Search Indonesian Detik.com news', usage: '†detik [keyword]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const q=args.join(' '); if(!q) return ctx.reply(`❌ Usage: \`${s.prefix}detik [keyword]\`${s.FOOTER}`);
        await ctx.react('📰');
        try {
            const res=await axios.get(`https://api.siputzx.my.id/api/s/detik?q=${encodeURIComponent(q)}`);
            const data=res.data?.data; if(!data?.length) return ctx.reply(`❌ No results for *${q}*.${s.FOOTER}`);
            const list=data.slice(0,5).map((n,i)=>`${i+1}. *${n.title}*\n   🔗 ${n.link||n.url}`).join('\n\n');
            ctx.reply(`📰 *Detik: "${q}"*\n\n${list}${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};

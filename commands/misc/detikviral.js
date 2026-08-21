const axios = require('axios');
module.exports = { name: 'detikviral', aliases: ['viral','viralberita','trending'], category: 'misc', desc: 'Viral trending news from Detik', usage: '†detikviral',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; await ctx.react('🔥');
        try { const res=await axios.get('https://api.siputzx.my.id/api/s/detik?q=viral'); const data=res.data?.data; if(!data?.length) return ctx.reply(`❌ No viral news.${s.FOOTER}`); const list=data.slice(0,5).map((n,i)=>`${i+1}. *${n.title}*\n   🔗 ${n.link||n.url}`).join('\n\n'); ctx.reply(`🔥 *Viral News:*\n\n${list}${s.FOOTER}`); }
        catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};

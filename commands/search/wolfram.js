const axios = require('axios');
module.exports = { name: 'wolfram', aliases: ['wolframalpha','wa','compute'], category: 'search', desc: 'Query Wolfram Alpha', usage: '†wolfram [query]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const q=args.join(' '); if(!q) return ctx.reply(`❌ Usage: \`${s.prefix}wolfram integrate x^2\`${s.FOOTER}`);
        await ctx.react('🧮');
        try {
            if (s.wolframKey) {
                const res=await axios.get(`http://api.wolframalpha.com/v1/result?appid=${s.wolframKey}&i=${encodeURIComponent(q)}`);
                return ctx.reply(`🧮 *Wolfram Alpha:*\n\n*Q:* ${q}\n*A:* ${res.data}${s.FOOTER}`);
            }
            const res=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Answer as Wolfram Alpha would: ${q}`)}`);
            ctx.reply(`🧮 *Wolfram AI:*\n\n${res.data?.data||'Could not compute.'}${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};

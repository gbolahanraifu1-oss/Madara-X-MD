const axios = require('axios');
module.exports = { name: 'defi', aliases: ['defitvl','defilocked','defiprotocol'], category: 'finance', desc: 'Top DeFi protocols by TVL', usage: '†defi',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; await ctx.react('💎');
        try {
            const res=await axios.get('https://api.llama.fi/protocols');
            const top=res.data.sort((a,b)=>b.tvl-a.tvl).slice(0,8);
            const list=top.map((p,i)=>`${i+1}. *${p.name}* — $${(p.tvl/1e9).toFixed(2)}B TVL`).join('\n');
            ctx.reply(`💎 *Top DeFi Protocols (TVL):*\n\n${list}\n\n_Data from DeFiLlama_${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ DeFi data failed: ${e.message}${s.FOOTER}`);}
    }
};

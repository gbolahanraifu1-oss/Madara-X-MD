const axios = require('axios');
module.exports = { name: 'feargreed', aliases: ['fearindex','cryptofear','marketsentiment'], category: 'finance', desc: 'Crypto Fear & Greed Index', usage: '†feargreed',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; await ctx.react('📊');
        try {
            const res=await axios.get('https://api.alternative.me/fng/?limit=1');
            const d=res.data?.data?.[0];
            const label=d?.value_classification||'Unknown'; const value=d?.value||'?';
            const emoji=parseInt(value)>75?'🟢 GREED':parseInt(value)>50?'🟡 Neutral':parseInt(value)>25?'🟠 FEAR':'🔴 Extreme Fear';
            ctx.reply(`📊 *Crypto Fear & Greed Index:*\n\n${emoji}\n📈 Score: *${value}/100*\n🏷️ Status: *${label}*\n\n_Higher = more greed, Lower = more fear_${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};

const axios = require('axios');
module.exports = { name: 'marketcap', aliases: ['topcrypto','cryptorank','coinrank'], category: 'finance', desc: 'Top 10 cryptocurrency market caps', usage: '†marketcap',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; await ctx.react('💹');
        try {
            const res=await axios.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1');
            const list=res.data.map((c,i)=>`${i+1}. *${c.symbol.toUpperCase()}* — $${c.current_price?.toLocaleString()} | ${c.price_change_percentage_24h?.toFixed(1)}% 24h`).join('\n');
            ctx.reply(`📊 *Top 10 Crypto Market Cap:*\n\n${list}\n\n_Data from CoinGecko_${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};

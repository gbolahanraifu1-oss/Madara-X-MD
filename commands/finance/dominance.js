const axios = require('axios');
const { menuBox } = require('../../lib/menuBox');
module.exports = { name: 'dominance', aliases: ['btcdominance','marketdom','cryptodominance'], category: 'finance', desc: 'BTC market dominance and global crypto stats', usage: '†dominance',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; await ctx.react('📊');
        try {
            const res=await axios.get('https://api.coingecko.com/api/v3/global');
            const d=res.data?.data;
            const fmt=n=>`$${(n/1e9).toFixed(2)}B`;
            ctx.reply(menuBox('📊', 'ɢʟᴏʙᴀʟ ᴄʀʏᴘᴛᴏ ᴍᴀʀᴋᴇᴛ', [
                `*Market Cap:* ${fmt(d?.total_market_cap?.usd||0)}`,
                `*24h Volume:* ${fmt(d?.total_volume?.usd||0)}`,
                `*BTC Dom:* ${d?.market_cap_percentage?.btc?.toFixed(1)}%`,
                `*ETH Dom:* ${d?.market_cap_percentage?.eth?.toFixed(1)}%`,
                `*Active Coins:* ${d?.active_cryptocurrencies?.toLocaleString()}`,
            ]) + s.FOOTER);
        } catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};

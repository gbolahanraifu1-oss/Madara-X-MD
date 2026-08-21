const axios = require('axios');
const { menuBox } = require('../../lib/menuBox');
module.exports = { name: 'price', aliases: ['cryptoprice','coinprice','coingecko'], category: 'finance', desc: 'Get crypto price', usage: '†price [coin] e.g. †price bitcoin',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const coin=(args[0]||'bitcoin').toLowerCase(); await ctx.react('💹');
        try {
            const res=await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd,ngn,eur&include_24hr_change=true`);
            const data=res.data[coin];
            if (!data) return ctx.reply(`❌ Coin *${coin}* not found. Try full name e.g. bitcoin, ethereum${s.FOOTER}`);
            const chg=data.usd_24h_change?.toFixed(2); const arrow=chg>0?'📈':'📉';
            ctx.reply(menuBox(arrow, `${coin.toUpperCase()} ᴘʀɪᴄᴇ`, [
                `*USD:* $${data.usd?.toLocaleString()}`,
                `*NGN:* ₦${data.ngn?.toLocaleString()}`,
                `*24h:* ${chg}%`,
            ]) + s.FOOTER);
        } catch(e){ctx.reply(`❌ Price lookup failed: ${e.message}${s.FOOTER}`);}
    }
};

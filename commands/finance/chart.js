const axios = require('axios');
const { menuBox } = require('../../lib/menuBox');
const { toSmallCaps } = require('../../lib/smallcaps');
module.exports = {
    name: 'chart',
    aliases: ['pricechart', 'cryptochart'],
    category: 'finance',
    desc: 'Get crypto price chart link',
    usage: '†chart [coin]  e.g. †chart bitcoin',
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const coin = (args[0] || 'bitcoin').toLowerCase();
        await ctx.react('📊');
        try {
            const res = await axios.get(`https://api.coingecko.com/api/v3/coins/${coin}?localization=false&tickers=false&community_data=false`);
            const d   = res.data;
            const cur = d.market_data?.current_price;
            ctx.reply(
                menuBox('📊', `${d.name} (${d.symbol?.toUpperCase()})`, [
                    `*${toSmallCaps('usd')}:* $${cur?.usd?.toLocaleString()}`,
                    `*${toSmallCaps('ngn')}:* ₦${cur?.ngn?.toLocaleString()}`,
                    `*${toSmallCaps('24h high')}:* $${d.market_data?.high_24h?.usd?.toLocaleString()}`,
                    `*${toSmallCaps('24h low')}:* $${d.market_data?.low_24h?.usd?.toLocaleString()}`,
                    `*${toSmallCaps('market cap')}:* $${d.market_data?.market_cap?.usd?.toLocaleString()}`,
                    `*${toSmallCaps('rank')}:* #${d.market_cap_rank}`,
                    `*${toSmallCaps('chart')}:* https://www.coingecko.com/en/coins/${coin}`,
                ]) + s.FOOTER
            );
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

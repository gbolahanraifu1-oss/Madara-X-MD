const axios = require('axios');
const { menuBox } = require('../../lib/menuBox');
const { toSmallCaps } = require('../../lib/smallcaps');
module.exports = {
    name: 'stock',
    aliases: ['stockprice', 'shares'],
    category: 'search',
    desc: 'Get stock price info',
    usage: '†stock [symbol]  e.g. †stock AAPL',
    async execute(sock, msg, args, ctx) {
        const s      = ctx.settings;
        const symbol = (args[0] || '').toUpperCase();
        if (!symbol) return ctx.reply(`❌ Provide a stock symbol.\n_Example: ${s.prefix}stock AAPL_${s.FOOTER}`);
        await ctx.react('📈');
        try {
            const res = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
            const d   = res.data?.chart?.result?.[0];
            if (!d) throw new Error('Symbol not found');
            const meta   = d.meta;
            const price  = meta.regularMarketPrice;
            const prev   = meta.previousClose || meta.chartPreviousClose;
            const change = price - prev;
            const pct    = ((change / prev) * 100).toFixed(2);
            const arrow  = change >= 0 ? '📈' : '📉';
            ctx.reply(
                menuBox(arrow, `${meta.symbol} — ${meta.shortName || symbol}`, [
                    `*${toSmallCaps('price')}:* $${price?.toFixed(2)}`,
                    `*${toSmallCaps('change')}:* ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${pct}%)`,
                    `*${toSmallCaps('prev close')}:* $${prev?.toFixed(2)}`,
                    `*${toSmallCaps('high')}:* $${meta.regularMarketDayHigh?.toFixed(2)}`,
                    `*${toSmallCaps('low')}:* $${meta.regularMarketDayLow?.toFixed(2)}`,
                    `*${toSmallCaps('volume')}:* ${meta.regularMarketVolume?.toLocaleString()}`,
                ]) + s.FOOTER
            );
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

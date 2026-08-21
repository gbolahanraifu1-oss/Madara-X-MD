const db    = require('../../lib/db');
const axios = require('axios');
const { menuBox } = require('../../lib/menuBox');
const { toSmallCaps } = require('../../lib/smallcaps');
module.exports = {
    name: 'portfolio',
    aliases: ['myportfolio', 'holdings'],
    category: 'finance',
    desc: 'Simple crypto portfolio tracker',
    usage: '†portfolio add BTC 0.5 | †portfolio list | †portfolio clear',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0]||'list').toLowerCase();
        const key = `portfolio_${ctx.sender.split('@')[0]}`;
        let holdings = db.get('finance', key, {});

        if (sub === 'add') {
            const coin = args[1]?.toLowerCase(), amt = parseFloat(args[2]);
            if (!coin || isNaN(amt)) return ctx.reply(`❌ Usage: \`${s.prefix}portfolio add BTC 0.5\`${s.FOOTER}`);
            holdings[coin] = (holdings[coin]||0) + amt;
            db.set('finance', key, holdings);
            return ctx.reply(`✅ Added *${amt} ${coin.toUpperCase()}* to portfolio.${s.FOOTER}`);
        }
        if (sub === 'remove') {
            const coin = args[1]?.toLowerCase();
            delete holdings[coin];
            db.set('finance', key, holdings);
            return ctx.reply(`🗑️ Removed *${coin?.toUpperCase()}* from portfolio.${s.FOOTER}`);
        }
        if (sub === 'clear') { db.set('finance', key, {}); return ctx.reply(`🗑️ Portfolio cleared.${s.FOOTER}`); }

        if (!Object.keys(holdings).length) return ctx.reply(`📊 Your portfolio is empty.\nUse \`${s.prefix}portfolio add BTC 0.5\`${s.FOOTER}`);
        await ctx.react('📊');
        try {
            const ids  = Object.keys(holdings).join(',');
            const res  = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
            const lines = [];
            let total  = 0;
            for (const [coin, amt] of Object.entries(holdings)) {
                const price = res.data[coin]?.usd || 0;
                const val   = price * amt;
                total += val;
                lines.push(`*${coin.toUpperCase()}:* ${amt} × $${price.toLocaleString()} = *$${val.toFixed(2)}*`);
            }
            lines.push(`*${toSmallCaps('total')}:* $${total.toFixed(2)}`);
            ctx.reply(menuBox('📊', toSmallCaps('portfolio'), lines) + s.FOOTER);
        } catch { ctx.reply(`❌ Price fetch failed.${s.FOOTER}`); }
    }
};

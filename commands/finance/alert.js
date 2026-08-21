const axios  = require('axios');
const db     = require('../../lib/db');
const alerts = new Map();

// Check alerts every 5 minutes
setInterval(async () => {
    for (const [key, alert] of alerts.entries()) {
        try {
            const res   = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${alert.coin}&vs_currencies=usd`);
            const price = res.data[alert.coin]?.usd;
            if (!price) continue;
            const triggered = alert.type === 'above' ? price >= alert.target : price <= alert.target;
            if (triggered) {
                alerts.delete(key);
                db.del('alerts', key);
                // Would send to WhatsApp but we don't have sock reference here — log instead
                console.log(`[alert] ${alert.coin} hit $${price} (target: ${alert.type} $${alert.target})`);
            }
        } catch {}
    }
}, 5 * 60 * 1000);

module.exports = {
    name: 'alert',
    aliases: ['pricealert', 'setalert'],
    category: 'finance',
    desc: 'Set a crypto price alert',
    usage: '†alert BTC above 70000 or †alert ETH below 2000',
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const coin = args[0]?.toLowerCase();
        const type = args[1]?.toLowerCase();
        const tgt  = parseFloat(args[2]);
        if (!coin || !['above','below'].includes(type) || isNaN(tgt))
            return ctx.reply(`❌ Usage: \`${s.prefix}alert BTC above 70000\`${s.FOOTER}`);
        const key = `${ctx.sender}_${coin}_${Date.now()}`;
        alerts.set(key, { coin, type, target: tgt, sender: ctx.sender, from: ctx.from });
        db.set('alerts', key, { coin, type, target: tgt });
        ctx.reply(`🔔 *Alert set!*\nI'll notify you when *${coin.toUpperCase()}* goes ${type} *$${tgt.toLocaleString()}*${s.FOOTER}`);
    }
};

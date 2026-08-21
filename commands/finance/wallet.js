const db = require('../../lib/db');
module.exports = {
    name: 'wallet',
    aliases: ['mywallet', 'balance'],
    category: 'finance',
    desc: 'Demo wallet — track virtual balance for fun/games',
    usage: '†wallet | †wallet add 1000 | †wallet send @user 500',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || 'balance').toLowerCase();
        const key = `wallet_${ctx.sender.split('@')[0]}`;
        let bal   = db.get('wallet', key, 1000); // start with 1000

        if (sub === 'balance' || sub === 'bal') {
            return ctx.reply(`💰 *Your Wallet*\n\n*Balance:* ₦${bal.toLocaleString()}\n\n_This is a demo wallet for fun!_${s.FOOTER}`);
        }
        if (sub === 'add') {
            const amt = parseInt(args[1]);
            if (isNaN(amt) || amt <= 0) return ctx.reply(`❌ Provide a valid amount.${s.FOOTER}`);
            bal += amt;
            db.set('wallet', key, bal);
            return ctx.reply(`✅ Added ₦${amt.toLocaleString()}!\n*New Balance:* ₦${bal.toLocaleString()}${s.FOOTER}`);
        }
        if (sub === 'send') {
            const target = ctx.getMentions()[0];
            const amt    = parseInt(args[2] || args[1]);
            if (!target || isNaN(amt) || amt <= 0) return ctx.reply(`❌ Usage: \`${s.prefix}wallet send @user 500\`${s.FOOTER}`);
            if (bal < amt) return ctx.reply(`❌ Insufficient balance. You have ₦${bal.toLocaleString()}.${s.FOOTER}`);
            const tKey  = `wallet_${target.split('@')[0]}`;
            const tBal  = db.get('wallet', tKey, 1000);
            db.set('wallet', key, bal - amt);
            db.set('wallet', tKey, tBal + amt);
            await sock.sendMessage(ctx.from, { text: `✅ Sent ₦${amt.toLocaleString()} to @${target.split('@')[0]}\n*Your Balance:* ₦${(bal-amt).toLocaleString()}${s.FOOTER}`, mentions: [target] }, { quoted: msg });
        }
    }
};

const db = require('../../lib/db');
module.exports = { name: 'bet', aliases: ['betting','gamblepoints','wager'], category: 'fun', desc: 'Simple betting game with points', usage: '†bet [amount] [heads|tails]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const amount=parseInt(args[0]); const choice=(args[1]||'').toLowerCase();
        if (isNaN(amount)||amount<1||!['heads','tails'].includes(choice)) return ctx.reply(`❌ Usage: \`${s.prefix}bet 100 heads\`${s.FOOTER}`);
        const key=`points_${ctx.sender}`; const points=db.get('points',key,1000);
        if (amount>points) return ctx.reply(`❌ You only have *${points}* points!\n\`${s.prefix}bet [amount] heads/tails\`${s.FOOTER}`);
        const result=['heads','tails'][Math.floor(Math.random()*2)];
        const win=choice===result;
        const newPoints=win?points+amount:points-amount;
        db.set('points',key,newPoints);
        ctx.reply(`🎰 *Bet Result:*\n\nCoin: *${result.toUpperCase()}* ${result==='heads'?'🪙':'🔵'}\nYour choice: *${choice.toUpperCase()}*\n\n${win?`🎉 *You WON ${amount} points!*\n💰 New balance: *${newPoints}*`:`💸 *You LOST ${amount} points!*\n💰 Remaining: *${newPoints}*`}${s.FOOTER}`);
    }
};

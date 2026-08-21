const db = require('../../lib/db');
module.exports = { name: 'reminderlist', aliases: ['reminders','listreminders','myreminders'], category: 'utility', desc: 'List all active reminders', usage: '†reminderlist',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const key=`reminders_${ctx.sender}`; const reminders=db.get('reminders',key,[]);
        if (!reminders.length) return ctx.reply(`📋 No active reminders.\nSet one: \`${s.prefix}remind 30m Buy groceries\`${s.FOOTER}`);
        const now=Date.now();
        const list=reminders.map((r,i)=>{const left=r.time-now;const mins=Math.max(0,Math.floor(left/60000));return `${i+1}. ⏰ *${r.text}*\n   ${left>0?`In ${mins} min`:'⚠️ Overdue'}`;}).join('\n\n');
        ctx.reply(`📋 *Your Reminders (${reminders.length}):*\n\n${list}${s.FOOTER}`);
    }
};

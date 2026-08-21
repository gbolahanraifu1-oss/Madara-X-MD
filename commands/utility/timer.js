module.exports = {
    name: 'timer',
    aliases: ['countdown', 'stopwatch'],
    category: 'utility',
    desc: 'Start a countdown timer',
    usage: '†timer [time]  e.g. †timer 5m',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s       = ctx.settings;
        const timeStr = args[0];
        if (!timeStr) return ctx.reply(`❌ Usage: \`${s.prefix}timer 5m\` or \`${s.prefix}timer 30s\`${s.FOOTER}`);
        let ms = 0;
        const parts = timeStr.match(/(\d+)(h|m|s)/gi) || [];
        if (!parts.length) return ctx.reply(`❌ Invalid time. Use: 30s, 5m, 1h${s.FOOTER}`);
        for (const p of parts) {
            const n = parseInt(p), u = p.slice(-1);
            ms += u==='h'?n*3600000:u==='m'?n*60000:n*1000;
        }
        if (ms > 3600000) return ctx.reply(`❌ Max timer is 1 hour.${s.FOOTER}`);
        ctx.reply(`⏱️ *Timer set for ${timeStr}!*\n_I'll notify you when it's done._${s.FOOTER}`);
        setTimeout(async () => {
            try {
                await sock.sendMessage(ctx.from, {
                    text: `⏰ *TIMER DONE!* (${timeStr})\n@${ctx.sender.split('@')[0]} Time's up!${s.FOOTER}`,
                    mentions: [ctx.sender]
                });
            } catch {}
        }, ms);
    }
};

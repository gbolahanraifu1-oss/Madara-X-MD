module.exports = {
    name: 'remind',
    aliases: ['reminder', 'setreminder'],
    category: 'utility',
    desc: 'Set a reminder (e.g. 10m, 1h, 2h30m)',
    usage: '†remind [time] [message]  e.g. †remind 30m Take medicine',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s        = ctx.settings;
        const timeStr  = args[0];
        const reminder = args.slice(1).join(' ');
        if (!timeStr || !reminder) return ctx.reply(`❌ Usage: \`${s.prefix}remind 30m Take medicine\`${s.FOOTER}`);

        // Parse time string (10s, 5m, 2h, 1h30m)
        let ms = 0;
        const parts = timeStr.match(/(\d+)(h|m|s)/gi) || [];
        if (!parts.length) return ctx.reply(`❌ Invalid time. Use: 30s, 10m, 2h, 1h30m${s.FOOTER}`);
        for (const p of parts) {
            const num  = parseInt(p);
            const unit = p.slice(-1);
            ms += unit === 'h' ? num*3600000 : unit === 'm' ? num*60000 : num*1000;
        }
        if (ms > 24*3600000) return ctx.reply(`❌ Max reminder time is 24 hours.${s.FOOTER}`);

        const when = new Date(Date.now() + ms).toLocaleTimeString();
        ctx.reply(`✅ *Reminder set!*\n⏰ I'll remind you at *${when}*\n📝 _${reminder}_${s.FOOTER}`);

        setTimeout(async () => {
            try {
                await sock.sendMessage(ctx.from, {
                    text: `⏰ *REMINDER*\n\n📝 ${reminder}\n\n_Set by @${ctx.sender.split('@')[0]}_${s.FOOTER}`,
                    mentions: [ctx.sender]
                });
            } catch {}
        }, ms);
    }
};

const cron = require('node-cron');
const db   = require('../../lib/db');
const jobs = new Map();

module.exports = {
    name: 'schedule',
    aliases: ['schedmsg', 'schedulemsg'],
    category: 'utility',
    desc: 'Schedule a message to be sent at a specific time',
    usage: '†schedule [time] [message]  e.g. †schedule 30m Good morning!',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s       = ctx.settings;
        const timeStr = args[0];
        const text    = args.slice(1).join(' ');
        if (!timeStr || !text) return ctx.reply(`❌ Usage: \`${s.prefix}schedule 1h Good morning everyone!\`${s.FOOTER}`);
        let ms = 0;
        const parts = timeStr.match(/(\d+)(h|m|s)/gi) || [];
        if (!parts.length) return ctx.reply(`❌ Invalid time format. Use: 30s, 10m, 2h${s.FOOTER}`);
        for (const p of parts) {
            const n = parseInt(p), u = p.slice(-1);
            ms += u === 'h' ? n * 3600000 : u === 'm' ? n * 60000 : n * 1000;
        }
        if (ms > 24 * 3600000) return ctx.reply(`❌ Max schedule time is 24 hours.${s.FOOTER}`);
        const when = new Date(Date.now() + ms).toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos', hour12: true });
        ctx.reply(`📅 *Scheduled!*\n⏰ Will send at *${when}* (Lagos time)\n📝 _${text}_${s.FOOTER}`);
        setTimeout(async () => {
            try {
                await sock.sendMessage(ctx.from, { text: `📅 *Scheduled Message:*\n\n${text}${s.FOOTER}` });
            } catch {}
        }, ms);
    }
};

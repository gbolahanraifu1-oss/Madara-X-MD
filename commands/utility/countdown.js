const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'countdown',
    aliases: ['countdownto', 'eventcountdown'],
    category: 'utility',
    desc: 'Countdown to a future date/event',
    usage: '†countdown [YYYY-MM-DD] [event name]',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const date = args[0];
        const name = args.slice(1).join(' ') || 'Event';
        if (!date) return ctx.reply(`❌ Usage: \`${s.prefix}countdown 2026-12-31 New Year\`${s.FOOTER}`);
        const target = new Date(date);
        if (isNaN(target)) return ctx.reply(`❌ Invalid date. Use format: YYYY-MM-DD${s.FOOTER}`);
        const now    = new Date();
        const diff   = target - now;
        if (diff < 0) return ctx.reply(`❌ That date has already passed!${s.FOOTER}`);
        const days  = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const mins  = Math.floor((diff % 3600000) / 60000);
        ctx.reply(
            menuBox('⏳', `ᴄᴏᴜɴᴛᴅᴏᴡɴ: ${name}`, [
                `*Date:* ${date}`,
                `*Days left:* ${days}`,
                `*Hours:* ${hours}`,
                `*Minutes:* ${mins}`,
            ]) + s.FOOTER
        );
    }
};

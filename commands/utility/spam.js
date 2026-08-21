module.exports = {
    name: 'spam',
    aliases: ['repeat', 'send'],
    category: 'utility',
    desc: 'Send a message multiple times (max 10)',
    usage: '†spam [count] [message]  e.g. †spam 5 Hello!',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s     = ctx.settings;
        const count = Math.min(parseInt(args[0]) || 3, 10);
        const text  = args.slice(1).join(' ');
        if (!text) return ctx.reply(`❌ Usage: \`${s.prefix}spam 5 Hello!\`${s.FOOTER}`);
        if (isNaN(count) || count < 1) return ctx.reply(`❌ Count must be 1-10.${s.FOOTER}`);
        const delay = ms => new Promise(r => setTimeout(r, ms));
        for (let i = 0; i < count; i++) {
            try { await sock.sendMessage(ctx.from, { text }); } catch {}
            await delay(500);
        }
    }
};

const db = require('../../lib/db');
module.exports = {
    name: 'mode',
    aliases: ['public', 'private', 'self'],
    category: 'system',
    desc: 'Toggle bot mode (public/private/self) — session-isolated',
    usage: '†mode [public|private|self]',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const m = args[0]?.toLowerCase();
        if (!m || !['public','private','self'].includes(m))
            return ctx.reply(`Current mode: *${s.commandMode}*\nUsage: \`${s.prefix}mode [public|private|self]\`${s.FOOTER}`);
        // Save to session-scoped DB — only affects THIS paired number,
        // never bleeds into other users' sessions.
        db.setSession(ctx.sessionPhone, 'config', 'commandMode', m);
        await ctx.reply(`✅ Bot mode set to *${m.toUpperCase()}*${s.FOOTER}`);
    }
};

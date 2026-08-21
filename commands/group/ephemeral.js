module.exports = {
    name: 'ephemeral',
    aliases: ['disappear', 'vanish'],
    category: 'group',
    desc: 'Toggle disappearing messages',
    usage: '†ephemeral [on|off|24h|7d|90d]',
    groupOnly: true, adminOnly: true, botAdminNeeded: true,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0]||'on').toLowerCase();
        const durations = { 'off': 0, '24h': 86400, '7d': 604800, '90d': 7776000, 'on': 604800 };
        const dur = durations[sub] ?? 604800;
        await sock.groupToggleEphemeral(ctx.from, dur);
        ctx.reply(dur === 0 ? `❌ Disappearing messages *disabled*.${s.FOOTER}` : `✅ Disappearing messages set to *${sub}*.${s.FOOTER}`);
    }
};

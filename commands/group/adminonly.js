module.exports = {
    name: 'adminonly',
    aliases: ['adminsonly', 'onlyadmins', 'adminmode'],
    category: 'group',
    desc: 'Restrict messaging to admins only (alias for chatclose)',
    usage: '†adminonly [on|off]',
    groupOnly: true, adminOnly: true, botAdminNeeded: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const sub = (args[0] || 'on').toLowerCase();
        if (sub === 'on' || sub === 'true') {
            await sock.groupSettingUpdate(ctx.from, 'announcement');
            ctx.reply(`🔒 *Admin-only mode ON* — only admins can send messages.${s.FOOTER}`);
        } else {
            await sock.groupSettingUpdate(ctx.from, 'not_announcement');
            ctx.reply(`✅ *Admin-only mode OFF* — all members can chat.${s.FOOTER}`);
        }
    }
};

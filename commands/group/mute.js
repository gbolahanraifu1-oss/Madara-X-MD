module.exports = {
    name: 'mute',
    aliases: ['lock', 'chatclose'],
    category: 'group',
    desc: 'Mute group — only admins can send messages',
    usage: '†mute',
    groupOnly: true, adminOnly: true, botAdminNeeded: true,
    async execute(sock, msg, args, ctx) {
        await sock.groupSettingUpdate(ctx.from, 'announcement');
        await ctx.reply(`🔇 *Group muted.* Only admins can send messages.${ctx.settings.FOOTER}`);
    }
};

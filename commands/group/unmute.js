module.exports = {
    name: 'unmute',
    aliases: ['unlock', 'chatopen'],
    category: 'group',
    desc: 'Unmute group — everyone can send messages',
    usage: '†unmute',
    groupOnly: true, adminOnly: true, botAdminNeeded: true,
    async execute(sock, msg, args, ctx) {
        await sock.groupSettingUpdate(ctx.from, 'not_announcement');
        await ctx.reply(`🔊 *Group unmuted.* Everyone can send messages.${ctx.settings.FOOTER}`);
    }
};

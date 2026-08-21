module.exports = {
    name: 'link',
    aliases: ['grouplink', 'invite'],
    category: 'group',
    desc: 'Get the group invite link',
    usage: '†link',
    groupOnly: true, adminOnly: true, botAdminNeeded: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const code = await sock.groupInviteCode(ctx.from);
        await ctx.reply(`🔗 *Group Invite Link:*\nhttps://chat.whatsapp.com/${code}${s.FOOTER}`);
    }
};

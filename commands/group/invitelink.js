module.exports = {
    name: 'invitelink',
    aliases: ['grouplink', 'getlink', 'invite'],
    category: 'group',
    desc: 'Get the group invite link',
    usage: '†invitelink',
    groupOnly: true, adminOnly: true, botAdminNeeded: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const code = await sock.groupInviteCode(ctx.from);
        ctx.reply(`🔗 *Group Invite Link:*\nhttps://chat.whatsapp.com/${code}${s.FOOTER}`);
    }
};

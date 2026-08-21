module.exports = {
    name: 'desc',
    aliases: ['setdesc', 'setgdesc'],
    category: 'group',
    desc: 'Change group description',
    usage: '†desc New description',
    groupOnly: true, adminOnly: true, botAdminNeeded: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        if (!ctx.text) return ctx.reply(`❌ Provide a description.${s.FOOTER}`);
        await sock.groupUpdateDescription(ctx.from, ctx.text);
        ctx.reply(`✅ Group description updated.${s.FOOTER}`);
    }
};

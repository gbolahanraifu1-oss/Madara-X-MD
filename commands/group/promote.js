module.exports = {
    name: 'promote',
    aliases: ['admin'],
    category: 'group',
    desc: 'Give admin rights to member(s)',
    usage: '†promote @user',
    groupOnly: true, adminOnly: true, botAdminNeeded: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const mentions = ctx.getMentions();
        if (!mentions.length) return ctx.reply(`❌ Tag someone to promote.${s.FOOTER}`);
        await sock.groupParticipantsUpdate(ctx.from, mentions, 'promote');
        const names = mentions.map(j => `@${j.split('@')[0]}`).join(', ');
        await ctx.reply(`✅ *${names}* promoted to admin!`, { mentions });
    }
};

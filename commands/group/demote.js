module.exports = {
    name: 'demote',
    aliases: ['unadmin'],
    category: 'group',
    desc: 'Remove admin rights from member(s)',
    usage: '†demote @user',
    groupOnly: true, adminOnly: true, botAdminNeeded: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const mentions = ctx.getMentions();
        if (!mentions.length) return ctx.reply(`❌ Tag someone to demote.${s.FOOTER}`);
        await sock.groupParticipantsUpdate(ctx.from, mentions, 'demote');
        const names = mentions.map(j => `@${j.split('@')[0]}`).join(', ');
        await ctx.reply(`✅ *${names}* demoted from admin.`, { mentions });
    }
};

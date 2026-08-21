module.exports = {
    name: 'promoteall',
    aliases: ['adminall', 'makeallAdmin'],
    category: 'group',
    desc: 'Promote ALL members to admin (use with caution)',
    usage: '†promoteall',
    groupOnly: true, adminOnly: true, botAdminNeeded: true, ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const meta = await sock.groupMetadata(ctx.from);
        const members = meta.participants.filter(p => !p.admin).map(p => p.id);
        if (!members.length) return ctx.reply(`✅ All members are already admins.${s.FOOTER}`);
        await ctx.react('⏳');
        const batch = 5;
        for (let i = 0; i < members.length; i += batch) {
            await sock.groupParticipantsUpdate(ctx.from, members.slice(i, i+batch), 'promote');
            await new Promise(r => setTimeout(r, 1000));
        }
        ctx.reply(`✅ Promoted *${members.length}* members to admin.${s.FOOTER}`);
    }
};

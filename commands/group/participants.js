module.exports = {
    name: 'participants',
    aliases: ['members', 'memberlist', 'listmembers'],
    category: 'group',
    desc: 'Lists all group members with their roles',
    usage: '†participants',
    groupOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const meta = await sock.groupMetadata(ctx.from);
        const admins = meta.participants.filter(p => p.admin);
        const members = meta.participants.filter(p => !p.admin);
        const adminList = admins.map((p,i) => `${i+1}. @${p.id.split('@')[0]} 👑`).join('\n');
        const memberList = members.slice(0, 20).map((p,i) => `${i+1}. @${p.id.split('@')[0]}`).join('\n');
        const mentions = meta.participants.map(p => p.id);
        ctx.reply(
            `👥 *${meta.subject} — ${meta.participants.length} Members*\n\n` +
            `*👑 Admins (${admins.length}):*\n${adminList}\n\n` +
            `*👤 Members (${members.length}):*\n${memberList}` +
            (members.length > 20 ? `\n_...and ${members.length - 20} more_` : '') +
            s.FOOTER,
            { mentions: mentions.slice(0, 30) }
        );
    }
};

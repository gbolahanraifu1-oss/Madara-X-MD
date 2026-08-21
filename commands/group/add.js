module.exports = {
    name: 'add',
    aliases: ['addmember'],
    category: 'group',
    desc: 'Add member(s) to group by number',
    usage: '†add 2347012345678',
    groupOnly: true, adminOnly: true, botAdminNeeded: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const numbers = args.map(a => a.replace(/[^0-9]/g,'') + '@s.whatsapp.net');
        if (!numbers.length) return ctx.reply(`❌ Provide number(s) to add.${s.FOOTER}`);
        const result = await sock.groupParticipantsUpdate(ctx.from, numbers, 'add');
        const added = result?.filter(r => r.status === '200').length || 0;
        ctx.reply(`✅ Added *${added}/${numbers.length}* member(s).${s.FOOTER}`);
    }
};

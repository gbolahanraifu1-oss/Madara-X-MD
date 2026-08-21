module.exports = { name: 'membercount', aliases: ['countmembers','groupsize','howmany'], category: 'group', desc: 'Count current group members', usage: '†membercount',
    groupOnly: true,
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings;
        try { const meta=await sock.groupMetadata(ctx.from); const admins=meta.participants.filter(p=>p.admin).length; ctx.reply(`👥 *${meta.subject}*\n\n*Total Members:* ${meta.participants.length}\n*Admins:* ${admins}\n*Members:* ${meta.participants.length-admins}${s.FOOTER}`); }
        catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};

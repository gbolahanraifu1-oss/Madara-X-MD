module.exports = {
    name: 'kick',
    aliases: ['remove'],
    category: 'group',
    desc: 'Remove member(s) from group',
    usage: '†kick @user',
    groupOnly: true, adminOnly: true, botAdminNeeded: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const mentions = [...(ctx._interactiveMentions || []), ...ctx.getMentions()];
        const quoted = ctx.quoted;
        let targets = [...mentions];
        if (!targets.length && quoted) {
            const qSender = msg.message?.extendedTextMessage?.contextInfo?.participant;
            if (qSender) targets.push(qSender);
        }
        if (!targets.length) {
            const number = args.join('').replace(/\D/g, '');
            if (number.length >= 7) targets.push(`${number}@s.whatsapp.net`);
        }
        if (!targets.length) return ctx.reply(`❌ Send a member number or tag a member.${s.FOOTER}`);
        for (const jid of targets) {
            try {
                await sock.groupParticipantsUpdate(ctx.from, [jid], 'remove');
                await ctx.reply(`✅ @${jid.split('@')[0]} has been kicked.`, { mentions: [jid] });
            } catch (e) {
                await ctx.reply(`❌ Failed to kick @${jid.split('@')[0]}: ${e.message}`);
            }
        }
    }
};

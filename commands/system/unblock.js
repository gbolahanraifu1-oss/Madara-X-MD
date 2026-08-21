module.exports = {
    name: 'unblock',
    aliases: ['unblockuser', 'unblockcontact'],
    category: 'system',
    desc: 'Unblock a user (owner-only)',
    usage: '†unblock [number]',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const mentions = ctx.getMentions?.() || [];
        let target = mentions[0];
        if (!target && args[0]) target = args[0].replace(/[^0-9]/g,'') + '@s.whatsapp.net';
        if (!target) return ctx.reply(`❌ Tag a user or provide a number.${s.FOOTER}`);
        try {
            await sock.updateBlockStatus(target, 'unblock');
            ctx.reply(`✅ *Unblocked:* @${target.split('@')[0]}${s.FOOTER}`, { mentions: [target] });
        } catch (e) { ctx.reply(`❌ Unblock failed: ${e.message}${s.FOOTER}`); }
    }
};

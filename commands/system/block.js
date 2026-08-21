module.exports = {
    name: 'block', aliases: ['blockuser','blockcontact'], category: 'system',
    desc: 'Block a user/number (owner only)', usage: '†block @user or †block [number]',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s        = ctx.settings;
        const mentions = ctx.getMentions?.() || [];
        let target     = mentions[0];
        if (!target && args[0]) target = args[0].replace(/[^0-9]/g,'') + '@s.whatsapp.net';
        if (!target) return ctx.reply(`❌ Tag a user or provide a number.${s.FOOTER}`);
        try {
            await sock.updateBlockStatus(target, 'block');
            ctx.reply(`🚫 *Blocked:* @${target.split('@')[0]}${s.FOOTER}`, { mentions: [target] });
        } catch (e) { ctx.reply(`❌ Block failed: ${e.message}${s.FOOTER}`); }
    }
};

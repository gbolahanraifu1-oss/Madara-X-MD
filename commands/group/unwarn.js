const db = require('../../lib/db');
module.exports = {
    name: 'unwarn',
    aliases: ['resetwarn'],
    category: 'group',
    desc: 'Remove warning from member',
    usage: '†unwarn @user',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const target = ctx.getMentions()[0] || msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return ctx.reply(`❌ Tag someone to unwarn.${s.FOOTER}`);
        const key = `${ctx.from}:${target}`;
        const before = db.get('warnings', key, 0);
        db.set('warnings', key, Math.max(0, before - 1));
        await sock.sendMessage(ctx.from, { text: `✅ Warning removed from @${target.split('@')[0]}. Now: ${Math.max(0,before-1)}/3${s.FOOTER}`, mentions: [target] });
    }
};

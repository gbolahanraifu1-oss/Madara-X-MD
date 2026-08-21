const db = require('../../lib/db');
const WARN_LIMIT = 3;
module.exports = {
    name: 'warn',
    aliases: ['w'],
    category: 'group',
    desc: 'Issue warning to member (auto-kick after 3)',
    usage: '†warn @user [reason]',
    groupOnly: true, adminOnly: true, botAdminNeeded: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const mentions = ctx.getMentions();
        const ctxPart  = msg.message?.extendedTextMessage?.contextInfo?.participant;
        const target   = mentions[0] || ctxPart;
        if (!target) return ctx.reply(`❌ Tag someone to warn.${s.FOOTER}`);
        const key   = `${ctx.from}:${target}`;
        const warns = (db.get('warnings', key, 0)) + 1;
        db.set('warnings', key, warns);
        const num = target.split('@')[0];
        if (warns >= WARN_LIMIT) {
            db.set('warnings', key, 0);
            await sock.groupParticipantsUpdate(ctx.from, [target], 'remove');
            return sock.sendMessage(ctx.from, { text: `🚫 @${num} has been *kicked* after ${WARN_LIMIT} warnings.${s.FOOTER}`, mentions: [target] });
        }
        const reason = args.slice(mentions.length).join(' ') || 'No reason given';
        await sock.sendMessage(ctx.from, {
            text: `⚠️ *WARNING ${warns}/${WARN_LIMIT}*\n@${num} — _${reason}_\n_${WARN_LIMIT - warns} more warning(s) before kick._${s.FOOTER}`,
            mentions: [target]
        });
    }
};

const db = require('../../lib/db');
module.exports = {
    name: 'stickerreply',
    aliases: ['autosticker', 'stickerauto', 'keywordsticker'],
    category: 'sticker',
    desc: 'Set auto-sticker response to a keyword',
    usage: '†stickerreply [keyword] (reply to sticker)',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const keyword = args.join(' ').toLowerCase();
        if (!keyword) return ctx.reply(`❌ Usage: \`${s.prefix}stickerreply [keyword]\` (reply to sticker)${s.FOOTER}`);
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const hasStkr = ctxInfo?.quotedMessage?.stickerMessage;
        if (!hasStkr) return ctx.reply(`❌ Reply to a sticker with the keyword.${s.FOOTER}`);
        const key = `stickerreply_${ctx.from}`;
        const cfg = db.get('stickerreply', key, {});
        cfg[keyword] = ctxInfo.stanzaId;
        db.set('stickerreply', key, cfg);
        ctx.reply(`✅ Auto-sticker set!\nKeyword: *"${keyword}"*\nBot will send this sticker when someone says that keyword.${s.FOOTER}`);
    }
};

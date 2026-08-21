const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'stickerinfo',
    aliases: ['stickmeta', 'getmeta'],
    category: 'sticker',
    desc: 'Show sticker metadata (pack/author)',
    usage: '†stickerinfo (reply to sticker)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let tgt = msg;
        if (ctxInfo?.quotedMessage) tgt = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        const stk = tgt.message?.stickerMessage || msg.message?.stickerMessage;
        if (!stk) return ctx.reply(`❌ Reply to a sticker.${s.FOOTER}`);
        ctx.reply(
            menuBox('🎨', 'sᴛɪᴄᴋᴇʀ ɪɴғᴏ', [
                `*Pack:* ${stk['packname'] || stk.stickerPackName || 'Unknown'}`,
                `*Author:* ${stk['author'] || 'Unknown'}`,
                `*Animated:* ${stk.isAnimated ? 'Yes' : 'No'}`,
                `*Avatar:* ${stk.isAvatar ? 'Yes' : 'No'}`,
            ]) + s.FOOTER
        );
    }
};

const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { Sticker, StickerTypes } = require('../../lib/sticker');

module.exports = {
    name: 'stickergif',
    aliases: ['gsticker', 'giftowebp'],
    category: 'sticker',
    desc: 'Convert GIF/video to animated WebP sticker',
    usage: '†stickergif (reply to GIF/video)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!target.message?.videoMessage) return ctx.reply(`❌ Reply to a GIF or video.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const sticker = new Sticker(buf, { pack: s.botName, author: s.ownerName, type: StickerTypes.ANIMATED });
            await sock.sendMessage(ctx.from, {
                sticker: await sticker.toBuffer(),
                stickerMetadata: sticker.metadata(),
            }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

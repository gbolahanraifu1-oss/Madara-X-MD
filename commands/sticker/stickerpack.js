const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { Sticker, StickerTypes } = require('../../lib/sticker');

module.exports = {
    name: 'stickerpack',
    aliases: ['makepack', 'createpack'],
    category: 'sticker',
    desc: 'Create a sticker with custom pack name and author',
    usage: '†stickerpack [packname] | [author] (reply to image/video)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let tgt = msg;
        if (ctxInfo?.quotedMessage) tgt = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        const parts    = ctx.text?.split('|').map(p => p.trim()) || [];
        const packname = parts[0] || s.botName;
        const author   = parts[1] || s.botBrand;
        const isImg = !!(tgt.message?.imageMessage || msg.message?.imageMessage);
        const isVid = !!(tgt.message?.videoMessage || msg.message?.videoMessage);
        if (!isImg && !isVid) return ctx.reply(`❌ Reply to an image or video.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf = await downloadMediaMessage(tgt, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const sticker = new Sticker(buf, { pack: packname, author, type: isVid ? StickerTypes.ANIMATED : StickerTypes.DEFAULT });
            await sock.sendMessage(ctx.from, {
                sticker: await sticker.toBuffer(),
                stickerMetadata: sticker.metadata(),
            }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

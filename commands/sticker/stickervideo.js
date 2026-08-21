const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { Sticker, StickerTypes } = require('../../lib/sticker');

module.exports = {
    // 'stickergif' removed from aliases — it collided with stickergif.js's
    // own primary name, and since this file loads after stickergif.js
    // alphabetically it was silently winning, stealing that command.
    name: 'stickervideo',
    aliases: ['videosticker', 'vsticker'],
    category: 'sticker',
    desc: 'Convert video/GIF to animated sticker',
    usage: '†stickervideo (reply to video or GIF)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let tgt = msg;
        if (ctxInfo?.quotedMessage) tgt = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        const isVid = !!(tgt.message?.videoMessage || msg.message?.videoMessage);
        if (!isVid) return ctx.reply(`❌ Reply to a video or GIF.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf = await downloadMediaMessage(tgt, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const sticker = new Sticker(buf, { pack: s.botName, author: s.ownerName, type: StickerTypes.ANIMATED });
            await sock.sendMessage(ctx.from, {
                sticker: await sticker.toBuffer(),
                stickerMetadata: sticker.metadata(),
            }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

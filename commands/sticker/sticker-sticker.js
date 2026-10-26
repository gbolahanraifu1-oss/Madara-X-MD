'use strict';
const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { Sticker, StickerTypes } = require('../../lib/sticker');
module.exports = {
    name: 'sticker', aliases: ['s', 'stiker', 'stic'],
    category: 'sticker', desc: 'ᴄᴏɴᴠᴇʀᴛ ɪᴍᴀɢᴇ/ᴠɪᴅᴇᴏ ᴛᴏ sᴛɪᴄᴋᴇʀ',
    usage: '†sticker (reply to image/video)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imgMsg  = quoted?.imageMessage || msg.message?.imageMessage;
        const vidMsg  = quoted?.videoMessage || msg.message?.videoMessage;
        const stkMsg  = quoted?.stickerMessage || msg.message?.stickerMessage;
        if (!imgMsg && !vidMsg && !stkMsg) return ctx.reply(`❌ ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ ᴏʀ ᴠɪᴅᴇᴏ.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const target = quoted
                ? { key: { remoteJid: ctx.from, id: msg.message.extendedTextMessage.contextInfo.stanzaId }, message: quoted }
                : msg;
            const buf = await downloadMediaMessage(target, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
            const sticker = new Sticker(buf, {
                pack: s.botName, author: s.ownerName,
                type: vidMsg ? StickerTypes.ANIMATED : StickerTypes.DEFAULT,
                quality: 70,
            });
            const stickerBuf = await sticker.toBuffer();
            await sock.sendMessage(ctx.from, { sticker: stickerBuf }, { quoted: msg });
        } catch (e) { await ctx.reply(`❌ sᴛɪᴄᴋᴇʀ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`); }
    }
};

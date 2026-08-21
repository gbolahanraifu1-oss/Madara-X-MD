'use strict';
const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { Sticker, StickerTypes } = require('../../lib/sticker');
module.exports = {
    name: 'scircle', aliases: ['circsticker', 'roundsticker'],
    category: 'sticker', desc: 'ᴍᴀᴋᴇ ᴄɪʀᴄʟᴇ sᴛɪᴄᴋᴇʀ',
    usage: '†scircle (reply to image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imgMsg = quoted?.imageMessage || msg.message?.imageMessage;
        if (!imgMsg) return ctx.reply(`❌ ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const target = quoted
                ? { key: { remoteJid: ctx.from, id: msg.message.extendedTextMessage.contextInfo.stanzaId }, message: quoted }
                : msg;
            const buf = await downloadMediaMessage(target, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
            const sticker = new Sticker(buf, {
                pack: s.botName, author: s.ownerName,
                type: StickerTypes.CIRCLE, quality: 70,
            });
            const stickerBuf = await sticker.toBuffer();
            await sock.sendMessage(ctx.from, { sticker: stickerBuf }, { quoted: msg });
        } catch (e) { await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`); }
    }
};

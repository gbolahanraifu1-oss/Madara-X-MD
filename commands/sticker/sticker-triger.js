'use strict';
const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { Sticker, StickerTypes } = require('../../lib/sticker');
module.exports = {
    name: 'trigger', aliases: ['trig', 'triggered'],
    category: 'sticker', desc: 'ᴀᴅᴅ ᴛʀɪɢɢᴇʀᴇᴅ ᴇғғᴇᴄᴛ ᴛᴏ ɪᴍᴀɢᴇ',
    usage: '†trigger (reply to image)',
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
            const url = `https://some-random-api.com/canvas/triggered?avatar=${encodeURIComponent('data:image/jpeg;base64,' + buf.toString('base64'))}`;
            const sticker = new Sticker(url, { pack: s.botName, author: s.ownerName, type: StickerTypes.ANIMATED, quality: 70 });
            await sock.sendMessage(ctx.from, { sticker: await sticker.toBuffer() }, { quoted: msg });
        } catch (e) { await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`); }
    }
};

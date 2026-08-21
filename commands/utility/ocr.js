'use strict';
const axios = require('axios');
const { downloadMediaMessage } = require('@itsliaaa/baileys');
module.exports = {
    name: 'ocr', aliases: ['readtext', 'scan', 'readimg'],
    category: 'utility', desc: 'ᴇxᴛʀᴀᴄᴛ ᴛᴇxᴛ ғʀᴏᴍ ᴀɴ ɪᴍᴀɢᴇ',
    usage: '†ocr (reply to image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imgMsg = quoted?.imageMessage || msg.message?.imageMessage;
        if (!imgMsg) return ctx.reply(`❌ ᴘʟᴇᴀsᴇ ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const target = quoted ? {
                key: { remoteJid: ctx.from, id: msg.message.extendedTextMessage.contextInfo.stanzaId },
                message: quoted
            } : msg;
            const buf = await downloadMediaMessage(target, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
            const form = new (require('form-data'))();
            form.append('file', buf, { filename: 'ocr.jpg', contentType: 'image/jpeg' });
            const res = await axios.post('https://api.ocr.space/parse/image', form, {
                headers: { ...form.getHeaders(), apikey: 'helloworld' }
            });
            const text = res.data?.ParsedResults?.[0]?.ParsedText?.trim();
            if (!text) return ctx.reply(`❌ ɴᴏ ᴛᴇxᴛ ғᴏᴜɴᴅ ɪɴ ɪᴍᴀɢᴇ.${s.FOOTER}`);
            await ctx.reply(`📝 *ᴇxᴛʀᴀᴄᴛᴇᴅ ᴛᴇxᴛ:*\n\n${text}${s.FOOTER}`);
        } catch (e) { await ctx.reply(`❌ ᴏᴄʀ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`); }
    }
};

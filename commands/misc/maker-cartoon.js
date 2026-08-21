'use strict';
const axios = require('axios');
const { downloadMediaMessage } = require('@itsliaaa/baileys');
module.exports = {
    name: 'cartoon', aliases: ['cartoonify', 'cartoonstyle'],
    category: 'misc', desc: 'ᴄᴀʀᴛᴏᴏɴɪғʏ ᴀɴ ɪᴍᴀɢᴇ',
    usage: '†cartoon (reply to image)',
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
            const form = new (require('form-data'))();
            form.append('image', buf, { filename: 'img.jpg', contentType: 'image/jpeg' });
            const res = await axios.post('https://api.deepai.org/api/toonify', form, {
                headers: { ...form.getHeaders(), 'api-key': 'quickstart-QUdJIGlzIGNvbWluZy4uLi4K' }
            });
            const outUrl = res.data?.output_url;
            if (!outUrl) return ctx.reply(`❌ ᴄᴀʀᴛᴏᴏɴɪғʏ ғᴀɪʟᴇᴅ.${s.FOOTER}`);
            await sock.sendMessage(ctx.from, { image: { url: outUrl }, caption: `🎨 ᴄᴀʀᴛᴏᴏɴɪғɪᴇᴅ!${s.FOOTER}` }, { quoted: msg });
        } catch (e) { await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`); }
    }
};

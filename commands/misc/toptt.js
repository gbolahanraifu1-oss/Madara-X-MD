'use strict';
const { downloadMediaMessage } = require('@itsliaaa/baileys');
module.exports = {
    name: 'toptt', aliases: ['tovoice', 'tovn'],
    category: 'misc', desc: 'ᴄᴏɴᴠᴇʀᴛ ᴀᴜᴅɪᴏ ᴛᴏ ᴘᴛᴛ ᴠᴏɪᴄᴇ ɴᴏᴛᴇ',
    usage: '†toptt (reply to audio)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const audMsg = quoted?.audioMessage || msg.message?.audioMessage;
        if (!audMsg) return ctx.reply(`❌ ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ᴀᴜᴅɪᴏ ᴍᴇssᴀɢᴇ.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const target = quoted
                ? { key: { remoteJid: ctx.from, id: msg.message.extendedTextMessage.contextInfo.stanzaId }, message: quoted }
                : msg;
            const buf = await downloadMediaMessage(target, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
            await sock.sendMessage(ctx.from, { audio: buf, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: msg });
        } catch (e) { await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`); }
    }
};

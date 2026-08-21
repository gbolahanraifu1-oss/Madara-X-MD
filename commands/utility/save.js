'use strict';
const { downloadMediaMessage } = require('@itsliaaa/baileys');
const fs   = require('fs');
const path = require('path');
module.exports = {
    name: 'save', aliases: ['dl', 'download'],
    category: 'utility', desc: 'sᴀᴠᴇ ᴀ ᴍᴇᴅɪᴀ ᴍᴇssᴀɢᴇ',
    usage: '†save (reply to media)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) return ctx.reply(`❌ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴍᴇᴅɪᴀ ᴍᴇssᴀɢᴇ.${s.FOOTER}`);
        const hasMedia = quoted.imageMessage || quoted.videoMessage || quoted.audioMessage || quoted.documentMessage || quoted.stickerMessage;
        if (!hasMedia) return ctx.reply(`❌ ɴᴏ ᴍᴇᴅɪᴀ ᴅᴇᴛᴇᴄᴛᴇᴅ.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const target = {
                key: { remoteJid: ctx.from, id: msg.message.extendedTextMessage.contextInfo.stanzaId, fromMe: false },
                message: quoted
            };
            const buf = await downloadMediaMessage(target, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
            const ext = quoted.imageMessage ? 'jpg' : quoted.videoMessage ? 'mp4' : quoted.audioMessage ? 'mp3' : quoted.stickerMessage ? 'webp' : 'bin';
            const mimetype = quoted.imageMessage?.mimetype || quoted.videoMessage?.mimetype || quoted.audioMessage?.mimetype || 'application/octet-stream';
            await sock.sendMessage(ctx.from, { document: buf, mimetype, fileName: `saved_${Date.now()}.${ext}` }, { quoted: msg });
        } catch (e) { await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`); }
    }
};

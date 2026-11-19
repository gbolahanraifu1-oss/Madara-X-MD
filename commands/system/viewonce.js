// language: JavaScript, file: commands/system/viewonce.js
'use strict';

const { downloadMediaMessage } = require('@itsliaaa/baileys');

module.exports = {
    name: 'viewonce',
    aliases: ['antiviewonce', 'openonce', 'saveviewonce', 'unviewonce', 'vonce', 'vv'],
    category: 'system',
    desc: 'Save/reveal a view-once photo or video (reply to it)',
    usage: '.viewonce (reply to a view-once message)',

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        
        // 1. Better context extraction (handles buttons, images, etc.)
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo 
            || msg.message?.imageMessage?.contextInfo
            || msg.message?.videoMessage?.contextInfo
            || msg.message?.buttonsResponseMessage?.contextInfo
            || msg.message?.listResponseMessage?.contextInfo;

        if (!ctxInfo?.quotedMessage) {
            return ctx.reply(`❌ Reply to a *view-once* photo or video to reveal it.${s.FOOTER}`);
        }

        // 2. Build the target message
        const target = {
            key: {
                remoteJid: ctx.from,
                id: ctxInfo.stanzaId,
                participant: ctxInfo.participant
            },
            message: ctxInfo.quotedMessage
        };

        const tmsg = target.message || {};

        // 3. Extract the actual media type
        // Baileys often wraps view-once in viewOnceMessageV2 or viewOnceMessage
        const voMsg = tmsg.viewOnceMessage?.message
            || tmsg.viewOnceMessageV2?.message
            || tmsg.viewOnceMessageV2Extension?.message
            || tmsg;

        const imgMsg = voMsg?.imageMessage || tmsg.imageMessage;
        const vidMsg = voMsg?.videoMessage || tmsg.videoMessage;
        const audMsg = voMsg?.audioMessage || tmsg.audioMessage;

        // 4. Check if it's actually view-once or just a normal reply
        const isViewOnce = 
            tmsg.viewOnceMessage || 
            tmsg.viewOnceMessageV2 || 
            tmsg.viewOnceMessageV2Extension ||
            imgMsg?.viewOnce || 
            vidMsg?.viewOnce || 
            audMsg?.viewOnce;

        if (!isViewOnce && !imgMsg && !vidMsg && !audMsg) {
            return ctx.reply(`❌ Reply to a *view-once* photo or video to reveal it.${s.FOOTER}`);
        }

        try { await ctx.react('👁️'); } catch (e) {}

        try {
            // 5. FIX: Pass the stripped inner message to downloadMediaMessage
            const downloadTarget = {
                key: target.key,
                message: voMsg
            };

            const buf = await downloadMediaMessage(
                downloadTarget,
                'buffer',
                {},
                { logger: undefined, reuploadRequest: sock.updateMediaMessage }
            );

            if (!buf) throw new Error('Failed to download media buffer');

            // 6. Send it back
            if (imgMsg) {
                await sock.sendMessage(ctx.from, {
                    image: buf,
                    caption: `👁️ *View-once revealed!*${s.FOOTER}`
                }, { quoted: msg });
            } else if (vidMsg) {
                await sock.sendMessage(ctx.from, {
                    video: buf,
                    caption: `👁️ *View-once video revealed!*${s.FOOTER}`
                }, { quoted: msg });
            } else if (audMsg) {
                await sock.sendMessage(ctx.from, {
                    audio: buf,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true,
                }, { quoted: msg });
                await ctx.reply(`👁️ *View-once audio revealed!*${s.FOOTER}`);
            }
        } catch (e) {
            console.error('[ViewOnce Error]', e.message);
            ctx.reply(`❌ Could not reveal: ${e.message}${s.FOOTER}`);
        }
    }
};
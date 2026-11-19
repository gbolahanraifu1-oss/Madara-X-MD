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
        
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo 
            || msg.message?.imageMessage?.contextInfo
            || msg.message?.videoMessage?.contextInfo;

        if (!ctxInfo?.quotedMessage) {
            return ctx.reply(`❌ Reply to a *view-once* photo or video to reveal it.${s.FOOTER}`);
        }

        const target = {
            key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant },
            message: ctxInfo.quotedMessage
        };

        const tmsg = target.message || {};

        const voMsg = tmsg.viewOnceMessage?.message
            || tmsg.viewOnceMessageV2?.message
            || tmsg.viewOnceMessageV2Extension?.message
            || tmsg;

        const imgMsg = voMsg?.imageMessage || tmsg.imageMessage;
        const vidMsg = voMsg?.videoMessage || tmsg.videoMessage;
        const audMsg = voMsg?.audioMessage || tmsg.audioMessage;

        if (!imgMsg && !vidMsg && !audMsg) {
            return ctx.reply(`❌ No media found in that message.${s.FOOTER}`);
        }

        try { await ctx.react('👁️'); } catch (e) {}

        try {
            const downloadTarget = { key: target.key, message: voMsg };

            const buf = await downloadMediaMessage(
                downloadTarget,
                'buffer',
                {},
                { logger: undefined, reuploadRequest: sock.updateMediaMessage }
            );

            if (!buf || buf.length === 0) throw new Error('Empty media buffer');

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
                    ptt: false,
                }, { quoted: msg });
                await ctx.reply(`👁️ *View-once audio revealed!*${s.FOOTER}`);
            }
        } catch (e) {
            let errorMsg = e.message;
            if (errorMsg.includes('No valid media URL') || errorMsg.includes('directPath')) {
                errorMsg = "Media expired or already opened. Reply to a fresh view-once message.";
            }
            ctx.reply(`❌ Could not reveal: ${errorMsg}${s.FOOTER}`);
        }
    }
};
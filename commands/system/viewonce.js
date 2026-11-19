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

        let tmsg = target.message || {};

        const imgMsg = tmsg.imageMessage || tmsg.viewOnceMessage?.message?.imageMessage || tmsg.viewOnceMessageV2?.message?.imageMessage;
        const vidMsg = tmsg.videoMessage || tmsg.viewOnceMessage?.message?.videoMessage || tmsg.viewOnceMessageV2?.message?.videoMessage;
        const audMsg = tmsg.audioMessage || tmsg.viewOnceMessage?.message?.audioMessage || tmsg.viewOnceMessageV2?.message?.audioMessage;

        if (!imgMsg && !vidMsg && !audMsg) {
            return ctx.reply(`❌ No media found in that message.${s.FOOTER}`);
        }

        try { await ctx.react('👁️'); } catch (e) {}

        try {
            // Pass the ORIGINAL target object here too.
            const buf = await downloadMediaMessage(
                target,
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
            ctx.reply(`❌ Could not reveal: ${e.message}${s.FOOTER}`);
        }
    }
};
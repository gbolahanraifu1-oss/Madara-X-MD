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

        // 1. Deep Unwrap
        let tmsg = ctxInfo.quotedMessage;
        if (tmsg.viewOnceMessageV2) tmsg = tmsg.viewOnceMessageV2.message;
        if (tmsg.viewOnceMessage) tmsg = tmsg.viewOnceMessage.message;
        if (tmsg.documentWithCaptionMessage) tmsg = tmsg.documentWithCaptionMessage.message;

        const imgMsg = tmsg.imageMessage;
        const vidMsg = tmsg.videoMessage;
        const audMsg = tmsg.audioMessage;

        if (!imgMsg && !vidMsg && !audMsg) {
            return ctx.reply(`❌ No media found in that message.${s.FOOTER}`);
        }

        let mediaObj = imgMsg || vidMsg || audMsg;
        let mediaType = imgMsg ? 'imageMessage' : vidMsg ? 'videoMessage' : 'audioMessage';

        try { await ctx.react('👁️'); } catch (e) {}

        try {
            // 2. Pass ONLY the inner media object to the downloader
            const target = {
                key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant },
                message: { [mediaType]: mediaObj }
            };

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
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

        // ── DEEP UNWRAP ──
        if (tmsg.viewOnceMessage) tmsg = tmsg.viewOnceMessage.message;
        if (tmsg.viewOnceMessageV2) tmsg = tmsg.viewOnceMessageV2.message;
        if (tmsg.viewOnceMessageV2Extension) tmsg = tmsg.viewOnceMessageV2Extension.message;
        if (tmsg.documentWithCaptionMessage) tmsg = tmsg.documentWithCaptionMessage.message;

        const imgMsg = tmsg.imageMessage;
        const vidMsg = tmsg.videoMessage;
        const audMsg = tmsg.audioMessage;

        if (!imgMsg && !vidMsg && !audMsg) {
            return ctx.reply(`❌ No media found in that message.${s.FOOTER}`);
        }

        let actualMedia = null;
        let mtype = null;

        if (imgMsg) { actualMedia = imgMsg; mtype = 'image'; }
        else if (vidMsg) { actualMedia = vidMsg; mtype = 'video'; }
        else if (audMsg) { actualMedia = audMsg; mtype = 'audio'; }

        if (!actualMedia.url && !actualMedia.directPath) {
             return ctx.reply(`❌ Media URL is missing. WhatsApp stripped it.${s.FOOTER}`);
        }

        try { await ctx.react('👁️'); } catch (e) {}

        try {
            const downloadTarget = {
                key: target.key,
                message: { [`${mtype}Message`]: actualMedia }
            };

            const buf = await downloadMediaMessage(
                downloadTarget,
                'buffer',
                {},
                { logger: undefined, reuploadRequest: sock.updateMediaMessage }
            );

            if (!buf || buf.length === 0) throw new Error('Empty media buffer');

            if (mtype === 'image') {
                await sock.sendMessage(ctx.from, {
                    image: buf,
                    caption: `👁️ *View-once revealed!*${s.FOOTER}`
                }, { quoted: msg });
            } else if (mtype === 'video') {
                await sock.sendMessage(ctx.from, {
                    video: buf,
                    caption: `👁️ *View-once video revealed!*${s.FOOTER}`
                }, { quoted: msg });
            } else if (mtype === 'audio') {
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
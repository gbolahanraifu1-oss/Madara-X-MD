// language: JavaScript, file: commands/system/ghost.js
'use strict';

const { downloadMediaMessage } = require('@itsliaaa/baileys');

module.exports = {
    name:     'ghost',
    aliases:  ['vvdm', 'vvself', 'vvdm2', 'viewdm2', 'ghostvv'],
    category: 'system',
    desc:     'Silently reveal a view-once media and send it to your DM',
    usage:    '.ghost (reply to a view-once message)',
    waitReact: false,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo 
            || msg.message?.imageMessage?.contextInfo
            || msg.message?.videoMessage?.contextInfo;

        const rawId = sock.user.id.split(':')[0];
        const selfJid = rawId.endsWith('@s.whatsapp.net') ? rawId : rawId + '@s.whatsapp.net';
        const dm = (content) => sock.sendMessage(selfJid, typeof content === 'string' ? { text: content } : content);

        if (!ctxInfo?.quotedMessage) {
            return dm(`❌ Reply to a *view-once* message.${s.FOOTER}`).catch(() => {});
        }

        const target = {
            key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant },
            message: ctxInfo.quotedMessage,
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
            return dm(`❌ No media found in that message.${s.FOOTER}`).catch(() => {});
        }

        let actualMedia = null;
        let mtype = null;

        if (imgMsg) { actualMedia = imgMsg; mtype = 'image'; }
        else if (vidMsg) { actualMedia = vidMsg; mtype = 'video'; }
        else if (audMsg) { actualMedia = audMsg; mtype = 'audio'; }

        if (!actualMedia.url && !actualMedia.directPath) {
             return dm(`❌ Media URL is missing from the payload. WhatsApp stripped it.${s.FOOTER}`).catch(() => {});
        }

        try {
            // Re-wrap cleanly for downloader
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
                await dm({ image: buf, caption: `👻 *ɢʜᴏsᴛ — ᴠɪᴇᴡ-ᴏɴᴄᴇ ʀᴇᴠᴇᴀʟᴇᴅ*${s.FOOTER}` });
            } else if (mtype === 'video') {
                await dm({ video: buf, caption: `👻 *ɢʜᴏsᴛ — ᴠɪᴇᴡ-ᴏɴᴄᴇ ᴠɪᴅᴇᴏ ʀᴇᴠᴇᴀʟᴇᴅ*${s.FOOTER}` });
            } else if (mtype === 'audio') {
                await dm({ audio: buf, mimetype: 'audio/ogg; codecs=opus', ptt: false });
            }
            
        } catch (e) {
            await dm(`❌ *ɢʜᴏsᴛ ғᴀɪʟᴇᴅ:* ${e.message}${s.FOOTER}`).catch(() => {});
            console.error('[Ghost] error:', e.message);
        }
    }
};
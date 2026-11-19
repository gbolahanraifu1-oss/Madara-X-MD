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

        const tmsg = target.message || {};

        // DEEP EXTRACTION: Look inside every possible wrapper
        const voMsg  = tmsg.viewOnceMessage?.message
            || tmsg.viewOnceMessageV2?.message
            || tmsg.viewOnceMessageV2Extension?.message
            || tmsg;

        const imgMsg = voMsg?.imageMessage || tmsg.imageMessage;
        const vidMsg = voMsg?.videoMessage || tmsg.videoMessage;
        const audMsg = voMsg?.audioMessage || tmsg.audioMessage;

        if (!imgMsg && !vidMsg && !audMsg) {
            return dm(`❌ No media found in that message.${s.FOOTER}`).catch(() => {});
        }

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
                await dm({ image: buf, caption: `👻 *ɢʜᴏsᴛ — ᴠɪᴇᴡ-ᴏɴᴄᴇ ʀᴇᴠᴇᴀʟᴇᴅ*${s.FOOTER}` });
            } else if (vidMsg) {
                await dm({ video: buf, caption: `👻 *ɢʜᴏsᴛ — ᴠɪᴇᴡ-ᴏɴᴄᴇ ᴠɪᴅᴇᴏ ʀᴇᴠᴇᴀʟᴇᴅ*${s.FOOTER}` });
            } else if (audMsg) {
                await dm({ audio: buf, mimetype: 'audio/ogg; codecs=opus', ptt: false });
            }
            
        } catch (e) {
            // CATCH THE EXACT ERROR
            let errorMsg = e.message;
            if (errorMsg.includes('No valid media URL') || errorMsg.includes('directPath')) {
                errorMsg = "Media has expired or was already opened. You must reply to a *fresh* (unopened) view-once message.";
            }
            await dm(`❌ *ɢʜᴏsᴛ ғᴀɪʟᴇᴅ:* ${errorMsg}${s.FOOTER}`).catch(() => {});
            console.error('[Ghost] error:', e.message);
        }
    }
};
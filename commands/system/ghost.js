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

        // FIX: Do NOT unwrap. Pass the original quotedMessage to the downloader.
        let tmsg = target.message || {};
        
        const imgMsg = tmsg.imageMessage || tmsg.viewOnceMessage?.message?.imageMessage || tmsg.viewOnceMessageV2?.message?.imageMessage;
        const vidMsg = tmsg.videoMessage || tmsg.viewOnceMessage?.message?.videoMessage || tmsg.viewOnceMessageV2?.message?.videoMessage;
        const audMsg = tmsg.audioMessage || tmsg.viewOnceMessage?.message?.audioMessage || tmsg.viewOnceMessageV2?.message?.audioMessage;

        if (!imgMsg && !vidMsg && !audMsg) {
            return dm(`❌ No media found in that message.${s.FOOTER}`).catch(() => {});
        }

        try {
            // Pass the ORIGINAL target object. Baileys needs the wrapper to decrypt.
            const buf = await downloadMediaMessage(
                target,
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
            await dm(`❌ *ɢʜᴏsᴛ ғᴀɪʟᴇᴅ:* ${e.message}${s.FOOTER}`).catch(() => {});
            console.error('[Ghost] error:', e.message);
        }
    }
};
// language: JavaScript, file: commands/system/ghost.js
// ╔══════════════════════════════════════════════════════╗
// ║   ghost — reveal view-once & forward to your DM       ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const { downloadMediaMessage } = require('@itsliaaa/baileys');

module.exports = {
    name:     'ghost',
    aliases:  ['vvdm', 'vvself', 'vvdm2', 'viewdm2', 'ghostvv'],
    category: 'system',
    desc:     'Silently reveal a view-once media and send it to your DM — no trace left in this chat',
    usage:    '.ghost (reply to a view-once message)',
    waitReact: false,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        
        // 1. Broad context parsing (handles text, buttons, images)
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo 
            || msg.message?.imageMessage?.contextInfo
            || msg.message?.videoMessage?.contextInfo
            || msg.message?.buttonsResponseMessage?.contextInfo
            || msg.message?.listResponseMessage?.contextInfo;

        // 2. Bulletproof Self-JID extraction
        const rawId = sock.user.id.split(':')[0];
        const selfJid = rawId.endsWith('@s.whatsapp.net') ? rawId : rawId + '@s.whatsapp.net';
        
        const dm = (content) => sock.sendMessage(selfJid, typeof content === 'string' ? { text: content } : content);

        // 3. Build target message
        let target = msg;
        if (ctxInfo?.quotedMessage) {
            target = {
                key: {
                    remoteJid:   ctx.from,
                    id:          ctxInfo.stanzaId,
                    participant: ctxInfo.participant,
                },
                message: ctxInfo.quotedMessage,
            };
        }

        const tmsg = target.message || {};

        // 4. Detect view-once or plain media
        const voMsg  = tmsg.viewOnceMessage?.message
            || tmsg.viewOnceMessageV2?.message
            || tmsg.viewOnceMessageV2Extension?.message;

        const imgMsg = voMsg?.imageMessage || tmsg.imageMessage;
        const vidMsg = voMsg?.videoMessage || tmsg.videoMessage;
        const audMsg = voMsg?.audioMessage || tmsg.audioMessage;

        if (!voMsg && !imgMsg && !vidMsg && !audMsg) {
            await dm(
                `❌ *ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴠɪᴇᴡ-ᴏɴᴄᴇ* ᴘʜᴏᴛᴏ ᴏʀ ᴠɪᴅᴇᴏ ᴛᴏ sᴇɴᴅ ɪᴛ ᴛᴏ ʏᴏᴜʀ ᴅᴍ.\n` +
                `_ᴀʟsᴏ ᴡᴏʀᴋs ᴏɴ ʀᴇɢᴜʟᴀʀ ᴍᴇᴅɪᴀ.${s.FOOTER}`
            ).catch(() => {});
            return;
        }

        try {
            // 5. FIX: Pass the stripped inner message to downloadMediaMessage
            const downloadTarget = voMsg 
                ? { key: target.key, message: voMsg } 
                : target;

            const buf = await downloadMediaMessage(
                downloadTarget,
                'buffer',
                {},
                { logger: undefined, reuploadRequest: sock.updateMediaMessage }
            );

            if (!buf) throw new Error('Failed to download media buffer');

            if (imgMsg) {
                await dm({
                    image:   buf,
                    caption: `👻 *ɢʜᴏsᴛ — ᴠɪᴇᴡ-ᴏɴᴄᴇ ʀᴇᴠᴇᴀʟᴇᴅ*\n_ᴄᴀᴘᴛᴜʀᴇᴅ sɪʟᴇɴᴛʟʏ — ɴᴏ ᴛʀᴀᴄᴇ ʟᴇғᴛ ɪɴ ᴛʜᴇ ᴏʀɪɢɪɴᴀʟ ᴄʜᴀᴛ_${s.FOOTER}`,
                });
            } else if (vidMsg) {
                await dm({
                    video:   buf,
                    caption: `👻 *ɢʜᴏsᴛ — ᴠɪᴇᴡ-ᴏɴᴄᴇ ᴠɪᴅᴇᴏ ʀᴇᴠᴇᴀʟᴇᴅ*\n_ᴄᴀᴘᴛᴜʀᴇᴅ sɪʟᴇɴᴛʟʏ — ɴᴏ ᴛʀᴀᴄᴇ ʟᴇғᴛ ɪɴ ᴛʜᴇ ᴏʀɪɢɪɴᴀʟ ᴄʜᴀᴛ_${s.FOOTER}`,
                });
            } else if (audMsg) {
                await dm({
                    audio:    buf,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt:      false,
                });
            }
            
        } catch (e) {
            await dm(`❌ *ɢʜᴏsᴛ ғᴀɪʟᴇᴅ:* ${e.message}${s.FOOTER}`).catch(() => {});
            console.error('[Ghost] error:', e.message);
        }
    }
};
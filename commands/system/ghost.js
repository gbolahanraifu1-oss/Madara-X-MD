// ╔══════════════════════════════════════════════════════╗
// ║   ghost — reveal view-once & forward to your DM       ║
// ║   fully silent: no reaction, no reply in the chat it  ║
// ║   was used in. All feedback goes to your own DM only. ║
// ╚══════════════════════════════════════════════════════╝
'use strict';

const { downloadMediaMessage } = require('@itsliaaa/baileys');

module.exports = {
    name:     'ghost',
    aliases:  ['vvdm', 'vvself', 'vvdm2', 'viewdm2', 'ghostvv'],
    category: 'system',
    desc:     'Silently reveal a view-once media and send it to your DM — no trace left in this chat',
    usage:    '†ghost (reply to a view-once message)',
    // Framework auto-reacts ⏳/✅ in the ORIGINAL chat for every command
    // unless this is explicitly false — that reaction alone was the "trace"
    // this whole command exists to avoid, regardless of the silent dm()
    // logic below.
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s       = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;

        // Self-chat JID — every response goes here and ONLY here.
        // Was .replace(/:\d+/,'') — same bug from earlier in this bot's
        // history: if sock.user.id already includes '@s.whatsapp.net',
        // that regex only strips the ':deviceId' part and leaves the
        // suffix in place, so appending '@s.whatsapp.net' again produces
        // a malformed doubled-suffix JID. sendMessage() to that JID
        // fails silently — which looked exactly like "not responding",
        // since this command is silent-by-design anyway.
        const selfJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const dm = (content) => sock.sendMessage(selfJid, typeof content === 'string' ? { text: content } : content);

        // ── Build target message ─────────────────────────
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

        // ── Detect view-once or plain media ──────────────
        const voMsg  = tmsg.viewOnceMessage?.message
            || tmsg.viewOnceMessageV2?.message
            || tmsg.viewOnceMessageV2Extension?.message;

        const imgMsg = voMsg?.imageMessage || tmsg.imageMessage;
        const vidMsg = voMsg?.videoMessage || tmsg.videoMessage;
        const audMsg = voMsg?.audioMessage || tmsg.audioMessage;

        // No valid target — even this stays fully silent in the chat now.
        // Replying publicly here (even just an error) defeats the whole
        // point of a "ghost" command: anyone watching sees the bot react
        // to that specific message and knows someone just tried to pull
        // it. Feedback goes to the DM instead, same as everything else.
        if (!voMsg && !imgMsg && !vidMsg && !audMsg) {
            await dm(
                `❌ *ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴠɪᴇᴡ-ᴏɴᴄᴇ* ᴘʜᴏᴛᴏ ᴏʀ ᴠɪᴅᴇᴏ ᴛᴏ sᴇɴᴅ ɪᴛ ᴛᴏ ʏᴏᴜʀ ᴅᴍ.\n` +
                `_ᴀʟsᴏ ᴡᴏʀᴋs ᴏɴ ʀᴇɢᴜʟᴀʀ ᴍᴇᴅɪᴀ. (ᴛʜɪs ᴡᴏɴ'ᴛ ᴡᴏʀᴋ ᴏɴ sᴛɪᴄᴋᴇʀs — ᴡʜᴀᴛsᴀᴘᴘ ᴅᴏᴇsɴ'ᴛ sᴜᴘᴘᴏʀᴛ ᴠɪᴇᴡ-ᴏɴᴄᴇ sᴛɪᴄᴋᴇʀs.)_${s.FOOTER}`
            ).catch(() => {});
            return;
        }

        // From here on: zero reaction, zero reply, zero trace in ctx.from.
        try {
            const downloadTarget = voMsg
                ? { key: target.key, message: voMsg }
                : target;

            const buf = await downloadMediaMessage(
                downloadTarget,
                'buffer',
                {},
                { logger: undefined, reuploadRequest: sock.updateMediaMessage }
            );

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
            // Nothing sent to ctx.from — no react(), no reply(). Fully ghost.
        } catch (e) {
            // Even failures stay off the original chat.
            await dm(`❌ *ɢʜᴏsᴛ ғᴀɪʟᴇᴅ:* ${e.message}${s.FOOTER}`).catch(() => {});
            console.error('[Ghost] error:', e.message);
        }
    }
};

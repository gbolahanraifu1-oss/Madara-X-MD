// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  TAG
// Ported from MADARA X-MD v2 tag system
// Smart: detects replied media and re-sends
// with all members mentioned
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const { downloadMediaMessage } = require('@itsliaaa/baileys');
module.exports = {
    name: 'tag',
    aliases: ['mention', 'tagmember', 'ping'],
    category: 'group',
    desc: 'Tag all members — if replying to media, forwards it with everyone tagged',
    usage: '†tag [message]  or reply to image/video/sticker + †tag',
    groupOnly: true, adminOnly: true, botAdminNeeded: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        try {
            const meta         = await sock.groupMetadata(ctx.from);
            const participants = meta.participants || [];
            // p.id || p.lid — Baileys v7 LID compatibility
            const mentions = participants.map(p => p.id || p.lid).filter(Boolean);

            const messageText = ctx.text || ' ';

            // Check for replied/quoted message
            const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
            let targetMsg = msg;
            if (ctxInfo?.quotedMessage) {
                targetMsg = {
                    key: {
                        remoteJid: ctx.from,
                        id: ctxInfo.stanzaId,
                        participant: ctxInfo.participant,
                    },
                    message: ctxInfo.quotedMessage,
                };
            }

            const tmsg      = targetMsg.message || {};
            const isImage   = !!(tmsg.imageMessage);
            const isVideo   = !!(tmsg.videoMessage);
            const isSticker = !!(tmsg.stickerMessage);

            // If reply has media — download and re-send with all mentions
            if (isImage || isVideo || isSticker) {
                try {
                    const buf = await downloadMediaMessage(
                        targetMsg, 'buffer', {},
                        { logger: undefined, reuploadRequest: sock.updateMediaMessage }
                    );
                    if (isImage) {
                        const caption = messageText !== ' ' ? messageText : (tmsg.imageMessage?.caption || '');
                        await sock.sendMessage(ctx.from, { image: buf, caption, mentions }, { quoted: msg });
                    } else if (isVideo) {
                        const caption = messageText !== ' ' ? messageText : (tmsg.videoMessage?.caption || '');
                        await sock.sendMessage(ctx.from, { video: buf, caption, mentions }, { quoted: msg });
                    } else if (isSticker) {
                        await sock.sendMessage(ctx.from, { sticker: buf, mentions }, { quoted: msg });
                        if (messageText && messageText !== ' ')
                            await sock.sendMessage(ctx.from, { text: messageText, mentions }, { quoted: msg });
                    }
                } catch (e) {
                    // Media download failed — fallback to text tag
                    console.error('[tag] media err:', e.message);
                    await sock.sendMessage(ctx.from, { text: messageText, mentions }, { quoted: msg });
                }

            } else if (ctxInfo?.quotedMessage) {
                // Replying to a text message — forward quoted text with all tagged
                const quotedText = ctxInfo.quotedMessage.conversation
                    || ctxInfo.quotedMessage.extendedTextMessage?.text
                    || messageText;
                await sock.sendMessage(ctx.from, { text: quotedText, mentions }, { quoted: msg });

            } else {
                // No reply — just tag everyone with the text
                await sock.sendMessage(ctx.from, { text: messageText, mentions }, { quoted: msg });
            }

        } catch (e) {
            console.error('[tag]', e);
            ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);
        }
    }
};

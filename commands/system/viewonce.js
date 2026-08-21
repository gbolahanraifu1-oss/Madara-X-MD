const { downloadMediaMessage } = require('@itsliaaa/baileys');
module.exports = {
    name: 'viewonce',
    aliases: ['antiviewonce', 'openonce', 'saveviewonce', 'unviewonce', 'vonce', 'vv'],
    category: 'system',
    desc: 'Save/reveal a view-once photo or video (reply to it)',
    usage: '†viewonce (reply to a view-once message)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;

        // Build target message
        let target = msg;
        if (ctxInfo?.quotedMessage) {
            target = {
                key: {
                    remoteJid: ctx.from,
                    id: ctxInfo.stanzaId,
                    participant: ctxInfo.participant
                },
                message: ctxInfo.quotedMessage
            };
        }

        const tmsg = target.message || {};

        // Detect view-once media (Baileys wraps them in viewOnceMessage or viewOnceMessageV2)
        const voMsg = tmsg.viewOnceMessage?.message
            || tmsg.viewOnceMessageV2?.message
            || tmsg.viewOnceMessageV2Extension?.message;

        // Also handle if user replied directly to a normal image/video
        const imgMsg  = voMsg?.imageMessage || tmsg.imageMessage;
        const vidMsg  = voMsg?.videoMessage || tmsg.videoMessage;
        const audMsg  = voMsg?.audioMessage || tmsg.audioMessage;

        if (!voMsg && !imgMsg && !vidMsg && !audMsg) {
            return ctx.reply(
                `❌ Reply to a *view-once* photo or video to reveal it.\n\n` +
                `_Also works on regular images/videos to re-send them._${s.FOOTER}`
            );
        }

        await ctx.react('👁️');
        try {
            // Use the view-once inner message if available
            const downloadTarget = voMsg ? {
                key: target.key,
                message: voMsg
            } : target;

            const buf = await downloadMediaMessage(
                downloadTarget,
                'buffer',
                {},
                { logger: undefined, reuploadRequest: sock.updateMediaMessage }
            );

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

'use strict';

module.exports = {
    name:      'ping',
    aliases:   ['latency', 'speed'],
    category:  'system',
    desc:      'Check bot response time',
    usage:     '.ping',
    waitReact: false,

    async execute(sock, msg, args, ctx) {
        const s     = ctx.settings;
        const start = msg.messageTimestamp ? msg.messageTimestamp * 1000 : Date.now();
        const rtt   = Date.now() - start;

        const channelCtx = s.newsletterJid ? {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid:   s.newsletterJid,
                newsletterName:  s.channelName || s.botName,
                serverMessageId: -1,
            },
        } : {};

        // Single voice-note board — speed result baked straight into the card
        await sock.sendMessage(ctx.from, {
            audio: await require('../../lib/toAudio').toPTT(require('fs').readFileSync(require('path').join(process.cwd(), 'media/alive.mp3')), 'mp3'),
            mimetype: 'audio/ogg; codecs=opus',
            ptt:      true,
            waveform: [100, 50, 80, 30, 100, 60, 40, 90, 70],
            fileName: 'madara_ping',
            contextInfo: {
                mentionedJid: [msg.key.participant || msg.key.remoteJid],
                externalAdReply: {
                    title:                 `${s.botName} sᴘᴇᴇᴅ: ${rtt}ᴍs 🎯`,
                    body:                  'ʀᴇsᴘᴏɴsᴇ ᴛɪᴍᴇ ᴍᴇᴀsᴜʀᴇᴅ',
                    thumbnailUrl:          '',
                    sourceUrl:             s.newsletterJid ? `https://whatsapp.com/channel/${s.newsletterJid}` : 'https://github.com',
                    mediaType:             1,
                    renderLargerThumbnail: true,
                },
                ...channelCtx,
            },
        }, { quoted: msg });
    },
};

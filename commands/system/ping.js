'use strict';
const fs = require('fs');
const path = require('path');

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

        // --- READ THUMBNAIL FROM MEDIA DIR ---
        const mediaDir = path.join(process.cwd(), 'media');
        let thumbBuffer = null;
        // try common names
        for (const name of ['thumb.jpg', 'thumbnail.jpg', 'madara.jpg', 'menu.jpg', 'alive.jpg']) {
            const p = path.join(mediaDir, name);
            if (fs.existsSync(p)) { thumbBuffer = fs.readFileSync(p); break; }
        }

        await sock.sendMessage(ctx.from, {
            audio: await require('../../lib/toAudio').toPTT(fs.readFileSync(path.join(mediaDir, 'alive.mp3')), 'mp3'),
            mimetype: 'audio/ogg; codecs=opus',
            ptt:      true,
            waveform: [100, 50, 80, 30, 100, 60, 40, 90, 70],
            fileName: 'madara_ping',
            contextInfo: {
                mentionedJid: [msg.key.participant || msg.key.remoteJid],
                externalAdReply: {
                    title: `${s.botName} sᴘᴇᴇᴅ: ${rtt}ᴍs 🎯`,
                    body: 'ʀᴇsᴘᴏɴsᴇ ᴛɪᴍᴇ ᴍᴇᴀsᴜʀᴇᴅ',
                    thumbnail: thumbBuffer, // <- now reads media dir
                    sourceUrl: s.newsletterJid ? `https://whatsapp.com/channel/${s.newsletterJid}` : 'https://github.com',
                    mediaType: 2, // 2 = big card, 1 = small side icon
                    renderLargerThumbnail: false,
                    showAdAttribution: true,
                },
                ...channelCtx,
            },
        }, { quoted: msg });
    },
};
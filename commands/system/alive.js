'use strict';
const os = require('os');
const { toSmallCaps } = require('../../lib/smallcaps');
function channelCtx(s) {
    if (!s.newsletterJid) return {};
    return { forwardingScore: 1, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: s.newsletterJid, newsletterName: s.channelName || s.botName, serverMessageId: -1 } };
}
module.exports = {
    name: 'alive', aliases: ['online', 'active'], category: 'system',
    desc: 'Confirms bot is online — sends voice note board with status', usage: '.alive',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const up = process.uptime();
        const d = Math.floor(up/86400), h = Math.floor((up%86400)/3600), m = Math.floor((up%3600)/60), sec = Math.floor(up%60);
        const mem = (process.memoryUsage().rss/1024/1024).toFixed(1);
        const ram = (os.totalmem()/1024/1024/1024).toFixed(1);

        // Single voice-note board — status + quote baked straight into the card
        await sock.sendMessage(ctx.from, {
            audio: await require('../../lib/toAudio').toPTT(require('fs').readFileSync(require('path').join(process.cwd(), 'media/alive.mp3')), 'mp3'),
            mimetype: 'audio/ogg; codecs=opus', ptt: true,
            waveform: [100,0,100,0,100,0,100], fileName: 'madara_alive',
            contextInfo: {
                mentionedJid: [msg.key.participant || msg.key.remoteJid],
                externalAdReply: {
                    title: toSmallCaps(`${s.botName} is ALIVE ✅`),
                    body: toSmallCaps(`⏱ ${d}d ${h}h ${m}m ${sec}s • v${s.version} • ${mem}MB/${ram}GB${s.footerAlive(ctx.sender)}`),
                    thumbnailUrl: s?.channelLink || 'https://whatsapp.com',
                    sourceUrl: s.newsletterJid ? `https://whatsapp.com/channel/${s.newsletterJid}` : 'https://github.com',
                    mediaType: 1, renderLargerThumbnail: true,
                },
                ...channelCtx(s),
            },
        }, { quoted: msg });
    },
};

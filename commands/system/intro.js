'use strict';
module.exports = {
    name: 'intro', aliases: ['wakeup', 'reality', 'madaraspeech', 'speech'], category: 'system',
    desc: 'Plays Madara Uchiha\'s "Wake up to reality" speech', usage: '.intro',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        try {
            const audioBuf = await require('../../lib/toAudio').toPTT(
                require('fs').readFileSync(require('path').join(process.cwd(), 'media', 'intro.mp3')),
                'mp3'
            );
            await sock.sendMessage(ctx.from, {
                audio: audioBuf,
                mimetype: 'audio/ogg; codecs=opus', ptt: true,
                contextInfo: { mentionedJid: [msg.key.participant||msg.key.remoteJid], externalAdReply: { title: '🔴 MADARA UCHIHA', body: '"Wake up to reality..."', thumbnailUrl: s?.channelLink || 'https://whatsapp.com', sourceUrl: s.newsletterJid ? `https://whatsapp.com/channel/${s.newsletterJid}` : 'https://github.com', mediaType: 1, renderLargerThumbnail: true } },
            }, { quoted: msg });
        } catch (e) {
            console.log('[Intro] audio unavailable:', e.message);
        }
        await sock.sendMessage(ctx.from, { text: `*"Wake up to reality!"*\n\n_"Nothing ever goes as planned in this world. The longer you live, the more you realize that the only things that truly exist in this reality are merely pain, suffering and futility."_\n\n— *Madara Uchiha*👁️${s.FOOTER}` }, { quoted: msg });
    },
};

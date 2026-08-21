'use strict';
module.exports = {
    name: 'power', aliases: ['madara', 'uchiha', 'sharingan'], category: 'system',
    desc: 'Madara power quote with audio', usage: '.power',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const quotes = [`_"Wake up to reality! Nothing ever goes as planned in this world."_`,`_"The concept of hope is nothing more than giving up."_`,`_"Would you consider dying together 'Teamwork' as well?"_`,`_"Power is not will, it is the phenomenon of physically making things happen."_`,`_"When a man learns to love, he must bear the risk of hatred."_`];
        const q = quotes[Math.floor(Math.random() * quotes.length)];
        await sock.sendMessage(ctx.from, {
            audio: { url: '' },
            mimetype: 'audio/mpeg', ptt: true, waveform: [100,90,80,100,70,100,60,90,100], fileName: 'madara_power',
            contextInfo: { mentionedJid: [msg.key.participant||msg.key.remoteJid], externalAdReply: { title: '🔴 MADARA UCHIHA — THE GREATEST', body: 'Infinite Tsukuyomi', thumbnailUrl: s?.channelLink || 'https://whatsapp.com', sourceUrl: s.newsletterJid ? `https://whatsapp.com/channel/${s.newsletterJid}` : 'https://github.com', mediaType: 1, renderLargerThumbnail: true } },
        }, { quoted: msg });
        await sock.sendMessage(ctx.from, { text: `👁️ *MADARA UCHIHA* 👁️\n\n${q}\n\n━━━━━━━━━━━━━━━\n🤖 *${s.botName}* — Powered by the Sharingan${s.FOOTER}` }, { quoted: msg });
    },
};

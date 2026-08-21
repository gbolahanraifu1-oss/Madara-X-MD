const { menuBox } = require('../../lib/menuBox');
module.exports = {
    name: 'channel',
    aliases: ['joinchannel', 'viewchannel', 'followchannel'],
    category: 'system',
    desc: 'Share the MADARA X-MD official WhatsApp channel link',
    usage: '†channel',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const jid = s.newsletterJid;
        const url = s.channelLink;

        // Send with "View Channel" native WhatsApp button via forwardedNewsletterMessageInfo
        await sock.sendMessage(ctx.from, {
            text: menuBox('📢', 'ᴏғғɪᴄɪᴀʟ ᴄʜᴀɴɴᴇʟ', [
                `*Name:* ${s.botName}`,
                `*Brand:* ${s.botBrand}`,
                ``,
                `🔗 ${url}`,
                ``,
                `_Follow for updates, new commands, and bot news!_`,
            ]) + s.FOOTER,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid:   jid || '120363424626346173@newsletter',
                    newsletterName:  `${s.botName} | ${s.botBrand}`,
                    serverMessageId: -1,
                }
            }
        }, { quoted: msg });
    }
};

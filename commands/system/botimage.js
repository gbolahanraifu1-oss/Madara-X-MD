const axios = require('axios');
module.exports = {
    name: 'botimage',
    aliases: ['setbotimage', 'botpp', 'setbotpp', 'botpic'],
    category: 'system',
    desc: "Set or view the bot's profile picture",
    usage: '†botimage [url] or reply to image | †botimage view',
    ownerOnly: true,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || '').toLowerCase();

        if (sub === 'view') {
            try {
                const url = await sock.profilePictureUrl(sock.user.id, 'image');
                const img = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
                return await sock.sendMessage(ctx.from, {
                    image: Buffer.from(img.data),
                    caption: `🤖 *Current bot profile picture*${s.FOOTER}`
                }, { quoted: msg });
            } catch { return ctx.reply(`❌ No profile picture set.${s.FOOTER}`); }
        }

        // Get image from reply or URL
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const hasQuotedImg = !!(ctxInfo?.quotedMessage?.imageMessage);
        const urlArg = args.find(a => a.startsWith('http'));

        let imgBuf = null;
        if (hasQuotedImg) {
            imgBuf = await ctx.downloadMedia();
        } else if (urlArg) {
            const res = await axios.get(urlArg, { responseType: 'arraybuffer', timeout: 15000 });
            imgBuf = Buffer.from(res.data);
        } else if (msg.message?.imageMessage) {
            imgBuf = await ctx.downloadMedia();
        }

        if (!imgBuf) return ctx.reply(`❌ Reply to an image or provide a URL.\n_Usage: ${s.prefix}botimage view | ${s.prefix}botimage (reply to image)_${s.FOOTER}`);

        try {
            await sock.updateProfilePicture(sock.user.id, imgBuf);
            ctx.reply(`✅ *Bot profile picture updated!*${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

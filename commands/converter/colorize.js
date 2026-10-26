const { downloadMediaMessage } = require('@itsliaaa/baileys');
const axios = require('axios');
module.exports = {
    name: 'colorize',
    aliases: ['colourize', 'addcolor', 'coloriseimage'],
    category: 'converter',
    desc: 'Colorize a black & white image with AI',
    usage: '†colorize (reply to B&W image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!target.message?.imageMessage) return ctx.reply(`❌ Reply to an image.${s.FOOTER}`);
        await ctx.react('🎨');
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const b64 = buf.toString('base64');
            const res = await axios.post('https://api.deepai.org/api/colorizer',
                { image: `data:image/jpeg;base64,${b64}` },
                { headers: { 'api-key': s.deepaiKey || 'quickstart-QUdJIGlzIHRoZSBmdXR1cmU=' } }
            );
            const url = res.data?.output_url;
            if (!url) throw new Error('No output URL');
            const img = await axios.get(url, { responseType: 'arraybuffer' });
            await sock.sendMessage(ctx.from, { image: Buffer.from(img.data), caption: `🎨 Colorized!${s.FOOTER}` }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Colorize failed: ${e.message}${s.FOOTER}`); }
    }
};

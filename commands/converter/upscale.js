const { downloadMediaMessage } = require('@itsliaaa/baileys');
const axios = require('axios');
module.exports = {
    name: 'upscale',
    aliases: ['upscaleimage', 'enhance2x', 'superres'],
    category: 'converter',
    desc: 'AI upscale image resolution (2x)',
    usage: '†upscale (reply to image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!target.message?.imageMessage) return ctx.reply(`❌ Reply to an image.${s.FOOTER}`);
        await ctx.react('🔍');
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const b64 = buf.toString('base64');
            const res = await axios.post('https://api.deepai.org/api/torch-srgan',
                { image: `data:image/jpeg;base64,${b64}` },
                { headers: { 'api-key': s.deepaiKey || 'quickstart-QUdJIGlzIHRoZSBmdXR1cmU=' } }
            );
            const url = res.data?.output_url;
            if (!url) throw new Error('No output URL');
            const img = await axios.get(url, { responseType: 'arraybuffer' });
            await sock.sendMessage(ctx.from, { image: Buffer.from(img.data), caption: `🔍 Upscaled 2x${s.FOOTER}` }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Upscale failed: ${e.message}${s.FOOTER}`); }
    }
};

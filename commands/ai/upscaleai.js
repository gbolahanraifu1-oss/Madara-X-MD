const { downloadMediaMessage } = require('@itsliaaa/baileys');
const axios = require('axios');
module.exports = {
    name: 'upscaleai', aliases: ['aiupscale','superscale','ai4k'], category: 'ai',
    desc: 'AI image upscaler', usage: '†upscaleai (reply to image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!target.message?.imageMessage) return ctx.reply(`❌ Reply to an image.${s.FOOTER}`);
        await ctx.react('🔍');
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const res = await axios.post('https://api.deepai.org/api/torch-srgan',
                { image: `data:image/jpeg;base64,${buf.toString('base64')}` },
                { headers: { 'api-key': s.deepaiKey || 'quickstart-QUdJIGlzIHRoZSBmdXR1cmU=' } });
            const url = res.data?.output_url;
            if (!url) throw new Error('No output URL');
            const img = await axios.get(url, { responseType: 'arraybuffer' });
            await sock.sendMessage(ctx.from, { image: Buffer.from(img.data), caption: `🔍 AI Upscaled!${s.FOOTER}` }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

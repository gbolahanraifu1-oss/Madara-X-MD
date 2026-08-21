const axios = require('axios');
const { downloadMediaMessage } = require('@itsliaaa/baileys');
const FormData = require('form-data');
module.exports = {
    name: 'enhance',
    aliases: ['upscale', 'upscaleai', 'colorize', 'fixphoto'],
    category: 'converter',
    desc: 'Enhance/upscale image quality using AI',
    usage: '†enhance (reply to image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let tgt = msg;
        if (ctxInfo?.quotedMessage) tgt = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!tgt.message?.imageMessage && !msg.message?.imageMessage) return ctx.reply(`❌ Reply to an image.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf  = await downloadMediaMessage(tgt, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const b64  = buf.toString('base64');
            const form = new FormData();
            form.append('image_file_b64', b64);
            // Use a free enhancement API
            const res = await axios.post('https://api.deepai.org/api/torch-srgan', form, {
                headers: { ...form.getHeaders(), 'api-key': 'quickstart-QUdJIGlzIGNvbWluZy4uLi4K' },
                timeout: 30000
            });
            const outUrl = res.data?.output_url;
            if (!outUrl) throw new Error('Enhancement failed');
            const imgRes = await axios.get(outUrl, { responseType: 'arraybuffer' });
            await sock.sendMessage(ctx.from, { image: Buffer.from(imgRes.data), caption: `✨ Enhanced!${s.FOOTER}` }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Enhancement failed: ${e.message}${s.FOOTER}`); }
    }
};

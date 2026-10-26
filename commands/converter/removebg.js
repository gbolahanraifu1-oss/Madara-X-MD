const axios = require('axios');
const { downloadMediaMessage } = require('@itsliaaa/baileys');
const FormData = require('form-data');
module.exports = {
    name: 'removebg',
    aliases: ['rmbg', 'nobg'],
    category: 'converter',
    desc: 'Remove background from image',
    usage: '†removebg (reply to image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        if (!s.removebgKey) return ctx.reply(`❌ RemoveBG API key not configured.${s.FOOTER}`);
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let tgt = msg;
        if (ctxInfo?.quotedMessage) tgt = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!tgt.message?.imageMessage && !msg.message?.imageMessage) return ctx.reply(`❌ Reply to an image.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf = await downloadMediaMessage(tgt, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const form = new FormData();
            form.append('image_file', buf, 'image.jpg');
            form.append('size', 'auto');
            const res = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
                headers: { ...form.getHeaders(), 'X-Api-Key': s.removebgKey },
                responseType: 'arraybuffer'
            });
            await sock.sendMessage(ctx.from, { image: Buffer.from(res.data), caption: `✅ Background removed!${s.FOOTER}` }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

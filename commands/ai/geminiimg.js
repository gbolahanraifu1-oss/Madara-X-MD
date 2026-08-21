const { downloadMediaMessage } = require('@itsliaaa/baileys');
const axios = require('axios');
module.exports = {
    name: 'geminiimg', aliases: ['aiimg','analyzeimg','gvision'], category: 'ai',
    desc: 'Analyze image with Google Gemini Vision', usage: '†geminiimg [question] (reply to image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const prompt = ctx.text || 'Describe this image in detail.';
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!target.message?.imageMessage) return ctx.reply(`❌ Reply to an image with your question.${s.FOOTER}`);
        await ctx.react('🤖');
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const b64 = buf.toString('base64');
            const mime = target.message.imageMessage.mimetype || 'image/jpeg';
            if (!s.geminiKey) return ctx.reply(`⚠️ Set GEMINI_API_KEY in .env for image analysis.\n\nPrompt was: ${prompt}${s.FOOTER}`);
            const res = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${s.geminiKey}`,
                { contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: mime, data: b64 } }] }] }
            );
            const reply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
            ctx.reply(`🖼️ *Gemini Vision:*\n\n${reply}${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

const { downloadMediaMessage } = require('@itsliaaa/baileys');
const axios = require('axios');
module.exports = {
    name: 'gptimg', aliases: ['gpt4vision','visionai','gptimage'], category: 'ai',
    desc: 'Analyze image using GPT-4 Vision', usage: '†gptimg [question] (reply to image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const prompt = ctx.text || 'Describe this image in detail.';
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!target.message?.imageMessage) return ctx.reply(`❌ Reply to an image.${s.FOOTER}`);
        await ctx.react('🤖');
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            if (!s.openaiKey) return ctx.reply(`⚠️ Set OPENAI_API_KEY in .env for GPT Vision.${s.FOOTER}`);
            const res = await axios.post('https://api.openai.com/v1/chat/completions',
                { model: 'gpt-4-vision-preview', max_tokens: 500,
                  messages: [{ role: 'user', content: [{ type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${buf.toString('base64')}` } }] }] },
                { headers: { Authorization: `Bearer ${s.openaiKey}`, 'Content-Type': 'application/json' } }
            );
            ctx.reply(`🤖 *GPT-4 Vision:*\n\n${res.data?.choices?.[0]?.message?.content || 'No response.'}${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

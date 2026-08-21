const axios = require('axios');
module.exports = {
    name: 'anonymize', aliases: ['redact','removeinfo','hidepii'], category: 'ai',
    desc: 'Anonymize sensitive text (remove names, emails, phones)', usage: '†anonymize [text] or reply to message',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const text = ctx.text || ctxInfo?.quotedMessage?.conversation;
        if (!text) return ctx.reply(`❌ Provide text or reply to a message.${s.FOOTER}`);
        await ctx.react('🔒');
        try {
            const res = await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Anonymize this text by replacing all personal info (names, emails, phone numbers, addresses, IDs) with [REDACTED]. Return only the anonymized text:\n\n${text}`)}`);
            ctx.reply(`🔒 *Anonymized:*\n\n${res.data?.data || 'Could not anonymize.'}${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

const axios = require('axios');
module.exports = {
    name: 'grammar', aliases: ['fixgrammar','grammarcheck','proofread'], category: 'ai',
    desc: 'Fix grammar and improve text using AI', usage: '†grammar [text] or reply to message',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const text = ctx.text || ctxInfo?.quotedMessage?.conversation;
        if (!text) return ctx.reply(`❌ Provide text or reply to a message.${s.FOOTER}`);
        await ctx.react('✏️');
        try {
            const res = await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Fix all grammar, spelling, and punctuation errors in this text. Return the corrected version followed by a brief explanation of changes made:\n\n${text}`)}`);
            ctx.reply(`✏️ *Grammar Fix:*\n\n${res.data?.data || 'Could not fix.'}${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

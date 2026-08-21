module.exports = {
    name: 'detectai', aliases: ['aidetect','isaiwritten','checkgpt'], category: 'ai',
    desc: 'Detect if text was written by AI', usage: '†detectai [text] or reply to message',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const text = ctx.text || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text;
        if (!text) return ctx.reply(`❌ Provide text or reply to a message.${s.FOOTER}`);
        await ctx.react('🔍');
        const words = text.split(/\s+/).length;
        const avgLen = text.split(/\s+/).reduce((a,w) => a + w.length, 0) / words;
        let score = 0;
        if (avgLen > 5.5) score += 25;
        if (words / Math.max(text.split(/[.!?]+/).length,1) > 18) score += 20;
        if (/\b(furthermore|moreover|additionally|consequently|therefore|thus)\b/i.test(text)) score += 25;
        if (/\b(delve|intricate|pivotal|multifaceted|nuanced|comprehensive)\b/i.test(text)) score += 30;
        score = Math.min(score, 99);
        const label = score > 70 ? '🤖 Likely AI-generated' : score > 40 ? '⚠️ Possibly AI-assisted' : '👤 Likely human-written';
        ctx.reply(`🔍 *AI Detection:*\n\n${label}\n📊 Score: *${score}%* | Words: ${words}${s.FOOTER}`);
    }
};

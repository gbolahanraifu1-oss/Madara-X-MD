const axios = require('axios');
module.exports = {
    name: 'gemini',
    aliases: ['ai', 'ask', 'gpt', 'claude', 'bard'],
    category: 'ai',
    desc: 'Chat with AI (Google Gemini / Llama)',
    usage: '†gemini [question]',
    async execute(sock, msg, args, ctx) {
        const s     = ctx.settings;
        const query = ctx.text || ctx.getQuotedText();
        if (!query) return ctx.reply(`❌ Ask something!\n_Usage: \`${s.prefix}gemini [question]\`_${s.FOOTER}`);
        await ctx.react('🤖');
        try {
            let reply = '';
            if (s.geminiKey) {
                // Use gemini-1.5-flash (gemini-pro is deprecated → 404)
                const res = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${s.geminiKey}`,
                    { contents: [{ parts: [{ text: query }] }] },
                    { timeout: 30000 }
                );
                reply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }
            // Free fallback — multiple sources
            if (!reply) {
                const sources = [
                    () => axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(query)}`, { timeout: 15000 })
                          .then(r => r.data?.data || r.data?.result),
                    () => axios.get(`https://api.ryzendesu.vip/api/ai/chatgpt?text=${encodeURIComponent(query)}`, { timeout: 15000 })
                          .then(r => r.data?.response || r.data?.answer || r.data?.data),
                    () => axios.get(`https://api.giftedtech.web.id/api/ai/llama3?apikey=gifted&q=${encodeURIComponent(query)}`, { timeout: 15000 })
                          .then(r => r.data?.result || r.data?.response),
                ];
                for (const src of sources) {
                    try { reply = await src(); if (reply?.length > 5) break; } catch {}
                }
            }
            if (!reply) return ctx.reply(`❌ AI unavailable right now. Try again.${s.FOOTER}`);
            ctx.reply(`🤖 *AI:*\n\n${reply}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ AI error: ${e.message.slice(0, 80)}${s.FOOTER}`);
        }
    }
};

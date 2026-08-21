const axios = require('axios');
module.exports = {
    name: 'rap', aliases: ['rapverse','generaterap','airap'], category: 'fun',
    desc: 'Generate a rap verse on any topic', usage: '†rap [topic]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const topic = args.join(' ') || 'life and hustle';
        await ctx.react('🎤');
        try {
            const res = await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Write a short rap verse (8 lines, AABB rhyme scheme) about: ${topic}. Make it hype and catchy.`)}`);
            ctx.reply(`🎤 *Rap Verse: "${topic}"*\n\n${res.data?.data || 'Verse could not be generated.'}${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Rap failed: ${e.message}${s.FOOTER}`); }
    }
};

const axios = require('axios');
module.exports = {
    name: 'story',
    aliases: ['shortstory', 'generatestory'],
    category: 'fun',
    desc: 'Generate a short interactive story',
    usage: '†story [theme]  e.g. †story adventure',
    async execute(sock, msg, args, ctx) {
        const s     = ctx.settings;
        const theme = ctx.text || 'adventure';
        await ctx.react('📖');
        try {
            const res = await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Write a short fun creative story (max 200 words) about: ${theme}. Make it engaging and end with a cliffhanger.`)}`);
            const story = res.data?.data || res.data?.result || 'Once upon a time, in a land far away...';
            ctx.reply(`📖 *Story: ${theme}*\n\n${story}${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

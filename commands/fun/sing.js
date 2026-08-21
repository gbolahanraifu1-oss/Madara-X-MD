const axios = require('axios');
module.exports = {
    name: 'sing', aliases: ['botsing','singaline','aisingline'], category: 'fun',
    desc: 'Bot "sings" a line from a popular song', usage: '†sing [genre?]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const genre = args.join(' ') || 'pop';
        await ctx.react('🎶');
        try {
            const res = await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Write ONE original song line in the style of ${genre} music. Make it catchy and fun. Do not copy real lyrics.`)}`);
            ctx.reply(`🎶 *🎵 Singing (${genre}):*\n\n_${res.data?.data || 'La la la, the music plays on... 🎵'}_${s.FOOTER}`);
        } catch { ctx.reply(`🎶 *🎵:*\n\n_La la la, the music never stops, the rhythm never drops... 🎵_${s.FOOTER}`); }
    }
};

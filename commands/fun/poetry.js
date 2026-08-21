const axios = require('axios');
module.exports = {
    name: 'poetry',
    aliases: ['poem', 'randompoem'],
    category: 'fun',
    desc: 'Get a random poem or generate one about a topic',
    usage: '†poetry [topic]',
    async execute(sock, msg, args, ctx) {
        const s     = ctx.settings;
        const topic = ctx.text;
        await ctx.react('📜');
        try {
            if (topic) {
                const res = await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Write a beautiful short poem (4-8 lines with rhyme) about: ${topic}`)}`);
                const poem = res.data?.data || res.data?.result || 'Words fade like morning dew...';
                ctx.reply(`📜 *Poem: ${topic}*\n\n${poem}${s.FOOTER}`);
            } else {
                const res  = await axios.get('https://poetrydb.org/random/1');
                const d    = res.data[0];
                const text = d.lines.slice(0, 12).join('\n');
                ctx.reply(`📜 *${d.title}*\n_by ${d.author}_\n\n${text}${d.lines.length > 12 ? '\n...' : ''}${s.FOOTER}`);
            }
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

const axios = require('axios');
module.exports = {
    name: 'romanize', aliases: ['toroman','romanisation','transliterate2'], category: 'language',
    desc: 'Romanize/transliterate non-Latin script text', usage: '†romanize [text]',
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const text = args.join(' ');
        if (!text) return ctx.reply(`❌ Usage: \`${s.prefix}romanize こんにちは\`${s.FOOTER}`);
        await ctx.react('🔤');
        try {
            const res = await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Romanize/transliterate this text to Latin alphabet with pronunciation guide: "${text}"`)}`);
            ctx.reply(`🔤 *Romanized:*\n\n${res.data?.data || 'Could not romanize.'}${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

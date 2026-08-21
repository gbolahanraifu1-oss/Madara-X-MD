const axios = require('axios');
module.exports = {
    name: 'synonymset', aliases: ['synonymlang','wordset','synonymtranslate'], category: 'language',
    desc: 'Find synonyms in a target language', usage: '†synonymset [word] [language]',
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const word = args[0];
        const lang = args.slice(1).join(' ') || 'Spanish';
        if (!word) return ctx.reply(`❌ Usage: \`${s.prefix}synonymset happy Spanish\`${s.FOOTER}`);
        await ctx.react('📖');
        try {
            const res = await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Give 5 synonyms for the word "${word}" in ${lang}. Format: English | ${lang} equivalent`)}`);
            ctx.reply(`📖 *Synonyms: "${word}" in ${lang}*\n\n${res.data?.data || 'No synonyms found.'}${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

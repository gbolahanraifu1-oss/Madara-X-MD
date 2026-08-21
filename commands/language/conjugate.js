const axios = require('axios');
module.exports = {
    name: 'conjugate', aliases: ['verbconjugate','conjugateverb','tenses'], category: 'language',
    desc: 'Conjugate a verb in all tenses', usage: '†conjugate [verb] [language?]',
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const verb = args[0];
        const lang = args.slice(1).join(' ') || 'English';
        if (!verb) return ctx.reply(`❌ Usage: \`${s.prefix}conjugate run English\`${s.FOOTER}`);
        await ctx.react('📝');
        try {
            const res = await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Conjugate the verb "${verb}" in ${lang}. Show: present, past, future, perfect, continuous. Format as a clean table.`)}`);
            ctx.reply(`📝 *Conjugation: "${verb}" (${lang})*\n\n${res.data?.data || 'Could not conjugate.'}${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

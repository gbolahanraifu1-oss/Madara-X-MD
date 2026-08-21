const axios = require('axios');
module.exports = {
    name: 'synonym', aliases: ['synonyms','antonyms','wordalt'], category: 'ai',
    desc: 'Find synonyms and antonyms for a word', usage: '†synonym [word]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const word = args.join(' ');
        if (!word) return ctx.reply(`❌ Usage: \`${s.prefix}synonym [word]\`${s.FOOTER}`);
        await ctx.react('📝');
        try {
            const res = await axios.get(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=10`);
            const syns = res.data?.map(w => w.word).join(', ') || 'None found';
            const res2 = await axios.get(`https://api.datamuse.com/words?rel_ant=${encodeURIComponent(word)}&max=5`);
            const ants = res2.data?.map(w => w.word).join(', ') || 'None found';
            ctx.reply(`📝 *Synonyms/Antonyms: "${word}"*\n\n✅ *Synonyms:* ${syns}\n❌ *Antonyms:* ${ants}${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

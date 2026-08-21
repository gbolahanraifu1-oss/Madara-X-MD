const axios = require('axios');
module.exports = { name: 'dict', aliases: ['dictionary','definition','meaning'], category: 'language', desc: 'Dictionary definition', usage: '†dict [word]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const word=args[0]; if(!word) return ctx.reply(`❌ Usage: \`${s.prefix}dict [word]\`${s.FOOTER}`);
        await ctx.react('📚');
        try {
            const res=await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
            const data=res.data[0]; const defs=data.meanings.slice(0,2).map(m=>`*${m.partOfSpeech}:* ${m.definitions[0].definition}`).join('\n');
            ctx.reply(`📚 *${data.word}* ${data.phonetic||''}\n\n${defs}${s.FOOTER}`);
        } catch{ctx.reply(`❌ Word *${word}* not found.${s.FOOTER}`);}
    }
};

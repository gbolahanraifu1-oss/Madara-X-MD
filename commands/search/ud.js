const axios = require('axios');
module.exports = {
    name: 'ud',
    aliases: ['urbandictionary', 'urban'],
    category: 'search',
    desc: 'Urban Dictionary definition',
    usage: '†ud [word]',
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const word = ctx.text;
        if (!word) return ctx.reply(`❌ Provide a word.${s.FOOTER}`);
        await ctx.react('📖');
        try {
            const res  = await axios.get(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(word)}`);
            const def  = res.data.list[0];
            if (!def) return ctx.reply(`❌ No definition found.${s.FOOTER}`);
            const definition = def.definition.replace(/\[|\]/g,'').slice(0,500);
            const example    = def.example?.replace(/\[|\]/g,'').slice(0,200) || '';
            ctx.reply(`📖 *${def.word}*\n\n${definition}\n\n${example ? `_Example: ${example}_\n\n` : ''}👍 ${def.thumbs_up} | 👎 ${def.thumbs_down}${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

const axios = require('axios');
module.exports = { name: 'celebrity', aliases: ['celeb','famousPerson','star'], category: 'search', desc: 'Celebrity info and biography', usage: '†celebrity [name]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const name=args.join(' '); if(!name) return ctx.reply(`❌ Usage: \`${s.prefix}celebrity Elon Musk\`${s.FOOTER}`);
        await ctx.react('⭐');
        try {
            const res=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Give a brief Wikipedia-style bio for: ${name}. Include: full name, birthdate, nationality, career highlights, net worth if known.`)}`);
            ctx.reply(`⭐ *Celebrity: ${name}*\n\n${res.data?.data||'No info found.'}${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};

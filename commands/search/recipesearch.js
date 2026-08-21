const axios = require('axios');
module.exports = { name: 'recipesearch', aliases: ['findrecipe','recipefind','cookfind'], category: 'search', desc: 'Search recipes by ingredients or name', usage: '†recipesearch [ingredients or dish name]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const q=args.join(' '); if(!q) return ctx.reply(`❌ Usage: \`${s.prefix}recipesearch chicken rice tomato\`${s.FOOTER}`);
        await ctx.react('🍳');
        try {
            const res=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Create a simple recipe using: ${q}. Include: dish name, prep time, ingredients list, and step-by-step instructions.`)}`);
            ctx.reply(`🍳 *Recipe: "${q}"*\n\n${res.data?.data||'Could not generate recipe.'}${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};

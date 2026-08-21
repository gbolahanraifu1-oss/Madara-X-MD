const axios = require('axios');
module.exports = { name: 'roastme', aliases: ['roast_me','selfroast','burnme'], category: 'fun', desc: 'Get roasted by the bot', usage: '†roastme',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings; const name = ctx.sender.split('@')[0]; await ctx.react('🔥');
        const rb = [`I'd roast you but my mom said not to burn trash. 🗑️`, `You're not stupid — bad luck thinking. 😅`, `Was gonna tell a joke about you but life already did. 💀`];
        try { const res = await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent('Funny playful roast. 1-2 sentences. Not offensive.')}`); const t=res.data?.data; if(t) return ctx.reply(`🔥 *Roast @${name}:*\n\n${t}${s.FOOTER}`,{mentions:[ctx.sender]}); throw 0; }
        catch { ctx.reply(`🔥 *Roast @${name}:*\n\n${rb[Math.floor(Math.random()*rb.length)]}${s.FOOTER}`,{mentions:[ctx.sender]}); }
    }
};

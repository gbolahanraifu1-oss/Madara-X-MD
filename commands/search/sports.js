const axios = require('axios');
module.exports = { name: 'sports', aliases: ['sportscore','sportsnews','footballscore'], category: 'search', desc: 'Sports scores and news', usage: '†sports [team or sport]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const q=args.join(' ')||'football';
        await ctx.react('⚽');
        try {
            const res=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Provide recent sports news or scores for: ${q}. Include latest match results if available.`)}`);
            ctx.reply(`⚽ *Sports: ${q}*\n\n${res.data?.data||'No sports data available.'}${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Sports info failed: ${e.message}${s.FOOTER}`);}
    }
};

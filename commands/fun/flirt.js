const axios = require('axios');
module.exports = { name: 'flirt', aliases: ['flirty','flirtline','sendflirt'], category: 'fun', desc: 'Flirty response generator', usage: '†flirt [@user?]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const m=ctx.getMentions?.()??[]; const target=m[0]?.split('@')[0]||args[0]||'you';
        const lines=["Are you a magician? Because whenever I look at you, everyone else disappears.","Do you have a map? I keep getting lost in your eyes.","Is your name Google? Because you have everything I've been searching for.","If you were a vegetable, you'd be a cute-cumber. 🥒"];
        await ctx.react('💌');
        try { const res=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent('Write a sweet funny flirty pick-up line. 1 sentence.')}`); const txt=res.data?.data; if(txt) return ctx.reply(`💌 *For @${target}:*\n\n${txt}${s.FOOTER}`,{mentions:m}); throw 0; }
        catch { ctx.reply(`💌 *For @${target}:*\n\n${lines[Math.floor(Math.random()*lines.length)]}${s.FOOTER}`,{mentions:m}); }
    }
};

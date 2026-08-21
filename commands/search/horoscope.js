const axios = require('axios');
module.exports = { name: 'horoscope', aliases: ['zodiac','starSign','dailyhoroscope'], category: 'search', desc: 'Detailed daily horoscope by zodiac sign', usage: '†horoscope [sign]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const sign=(args[0]||'aries').toLowerCase();
        const signs=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
        if (!signs.includes(sign)) return ctx.reply(`❌ Valid signs: ${signs.join(', ')}${s.FOOTER}`);
        await ctx.react('⭐');
        try {
            const res=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Write today's detailed horoscope for ${sign}. Cover: love, career, health, luck. Make it fun and positive.`)}`);
            ctx.reply(`⭐ *${sign.charAt(0).toUpperCase()+sign.slice(1)} Horoscope:*\n\n${res.data?.data||'The stars are aligning for great things!'}${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};

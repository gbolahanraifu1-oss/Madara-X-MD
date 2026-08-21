const axios = require('axios');
module.exports = {
    name: 'horo', aliases: ['horoscope','zodiac','dailyhoro'], category: 'fun',
    desc: 'Daily horoscope by zodiac sign', usage: '†horo [sign]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const sign = (args[0] || 'aries').toLowerCase();
        const signs = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
        if (!signs.includes(sign)) return ctx.reply(`❌ Valid signs:\n${signs.join(', ')}${s.FOOTER}`);
        await ctx.react('⭐');
        try {
            const res = await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Write today's horoscope for ${sign}. Cover: love, career, health, lucky number. Keep it fun and positive.`)}`);
            ctx.reply(`⭐ *${sign.charAt(0).toUpperCase()+sign.slice(1)} Horoscope:*\n\n${res.data?.data || 'The stars are aligning for great things today!'}${s.FOOTER}`);
        } catch { ctx.reply(`⭐ *${sign.charAt(0).toUpperCase()+sign.slice(1)}:*\n\nToday brings new opportunities. Trust your instincts and embrace what comes your way! ✨${s.FOOTER}`); }
    }
};

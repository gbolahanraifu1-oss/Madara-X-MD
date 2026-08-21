const axios = require('axios');
module.exports = {
    name: 'yesno',
    aliases: ['oracle', 'yesorno'],
    category: 'fun',
    desc: 'Get a yes or no answer with GIF',
    usage: '†yesno [question]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        await ctx.react('🎱');
        try {
            const res = await axios.get('https://yesno.wtf/api');
            const ans = res.data.answer.toUpperCase();
            const emoji = ans === 'YES' ? '✅' : ans === 'NO' ? '❌' : '🤔';
            const q = ctx.text || 'Your question';
            ctx.reply(`🎱 *Yes or No Oracle*\n\n❓ _${q}_\n\n${emoji} *${ans}*${s.FOOTER}`);
        } catch { ctx.reply(`🎱 *${Math.random()<0.5?'✅ YES':'❌ NO'}*${ctx.settings.FOOTER}`); }
    }
};

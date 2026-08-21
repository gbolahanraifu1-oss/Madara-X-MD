const axios = require('axios');
module.exports = {
    name: 'advice', aliases: ['lifeadvice','tip','randomadvice'], category: 'fun',
    desc: 'Random life advice', usage: '†advice',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const fb = ["Don't wait for the perfect moment, take the moment and make it perfect.", "You don't have to be great to start, but you have to start to be great."];
        try {
            const res = await axios.get('https://api.adviceslip.com/advice');
            ctx.reply(`💡 *Advice:*\n\n_"${res.data?.slip?.advice}"_${s.FOOTER}`);
        } catch { ctx.reply(`💡 *Advice:*\n\n_"${fb[Math.floor(Math.random()*fb.length)]}"_${s.FOOTER}`); }
    }
};

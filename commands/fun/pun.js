const axios = require('axios');
module.exports = { name: 'pun', aliases: ['puns','wordpun'], category: 'fun', desc: 'Random pun', usage: '†pun',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const fb = ["I used to hate facial hair, but then it grew on me.", "Time flies like an arrow. Fruit flies like a banana."];
        try { const res = await axios.get('https://v2.jokeapi.dev/joke/Pun?type=single'); if (res.data?.joke) return ctx.reply(`😄 *Pun:*\n\n${res.data.joke}${s.FOOTER}`); throw 0; }
        catch { ctx.reply(`😄 *Pun:*\n\n${fb[Math.floor(Math.random()*fb.length)]}${s.FOOTER}`); }
    }
};

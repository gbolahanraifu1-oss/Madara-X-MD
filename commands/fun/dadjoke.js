const axios = require('axios');
module.exports = { name: 'dadjoke', aliases: ['dj','dad','papaoke'], category: 'fun', desc: 'Random dad joke', usage: '†dadjoke',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const fb = ["I'm afraid for the calendar. Its days are numbered.", "What do you call cheese that isn't yours? Nacho cheese."];
        try { const res = await axios.get('https://icanhazdadjoke.com/', { headers: { Accept: 'application/json' } }); ctx.reply(`👨 *Dad Joke:*\n\n${res.data.joke}${s.FOOTER}`); }
        catch { ctx.reply(`👨 *Dad Joke:*\n\n${fb[Math.floor(Math.random()*fb.length)]}${s.FOOTER}`); }
    }
};

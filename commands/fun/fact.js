const axios = require('axios');
module.exports = {
    name: 'fact',
    aliases: ['randomfact', 'funfact'],
    category: 'fun',
    desc: 'Get a random interesting fact',
    usage: '†fact',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        try {
            const res = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
            ctx.reply(`💡 *Random Fact:*\n\n_${res.data.text}_${s.FOOTER}`);
        } catch { ctx.reply(`💡 Honey bees can recognize human faces.${s.FOOTER}`); }
    }
};

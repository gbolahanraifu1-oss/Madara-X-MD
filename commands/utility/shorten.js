const axios = require('axios');
module.exports = {
    name: 'shorten',
    aliases: ['shorturl', 'tinyurl', 'bitly'],
    category: 'utility',
    desc: 'Shorten a URL',
    usage: '†shorten [url]',
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const url = args[0];
        if (!url) return ctx.reply(`❌ Provide a URL.${s.FOOTER}`);
        try {
            const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
            ctx.reply(`🔗 *URL Shortened:*\n\n📎 Original: ${url}\n✂️ Short: *${res.data}*${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

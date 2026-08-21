const axios = require('axios');
module.exports = {
    name: 'ssweb',
    aliases: ['screenshot', 'webshot', 'ssmobile'],
    category: 'search',
    desc: 'Take a screenshot of any website',
    usage: '†ssweb [url]',
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const url = args[0];
        if (!url) return ctx.reply(`❌ Provide a URL.\n_Usage: ${s.prefix}ssweb https://google.com_${s.FOOTER}`);
        await ctx.react('📸');
        try {
            const isMobile = ctx.rawCmd === 'ssmobile';
            const apiUrl   = `https://api.screenshotone.com/take?url=${encodeURIComponent(url)}&viewport_width=${isMobile?390:1280}&viewport_height=${isMobile?844:800}&format=jpg&access_key=free`;
            // Fallback to a different free API
            const ssUrl = `https://image.thum.io/get/width/1280/crop/800/${encodeURIComponent(url)}`;
            const res = await axios.get(ssUrl, { responseType: 'arraybuffer', timeout: 15000 });
            await sock.sendMessage(ctx.from, {
                image: Buffer.from(res.data),
                caption: `📸 *Screenshot of:* ${url}${s.FOOTER}`
            }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Screenshot failed: ${e.message}${s.FOOTER}`); }
    }
};

const axios = require('axios');
module.exports = {
    name: 'stories',
    aliases: ['igstories', 'igstory', 'instastory'],
    category: 'media',
    desc: 'Download Instagram Stories',
    usage: '†stories [instagram-url]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const url = args[0];
        if (!url || !url.includes('instagram.com')) return ctx.reply(`❌ Provide a valid Instagram URL.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const res  = await axios.get(`https://api.siputzx.my.id/api/d/instagram?url=${encodeURIComponent(url)}`);
            const link = res.data?.data?.image || res.data?.data?.url;
            if (!link) throw new Error('No media found');
            const media = await axios.get(link, { responseType: 'arraybuffer' });
            await sock.sendMessage(ctx.from, { image: Buffer.from(media.data), caption: `📸 Instagram Story${s.FOOTER}` }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

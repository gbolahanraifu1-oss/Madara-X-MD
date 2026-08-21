const axios = require('axios');
module.exports = {
    name: 'reels',
    aliases: ['instareels', 'igr', 'igreels'],
    category: 'media',
    desc: 'Download Instagram Reels',
    usage: '†reels [instagram-url]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const url = args[0];
        if (!url || !url.includes('instagram.com')) return ctx.reply(`❌ Provide a valid Instagram URL.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const res  = await axios.get(`https://api.siputzx.my.id/api/d/instagram?url=${encodeURIComponent(url)}`);
            const link = res.data?.data?.url || res.data?.data?.video;
            if (!link) throw new Error('No media found');
            const media = await axios.get(link, { responseType: 'arraybuffer' });
            await sock.sendMessage(ctx.from, { video: Buffer.from(media.data), caption: `🎬 Instagram Reel${s.FOOTER}` }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

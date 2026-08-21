const axios = require('axios');
module.exports = {
    name: 'fbdl', aliases: ['facebookdl','fbdownload','fbvideo'], category: 'media',
    desc: 'Download Facebook video/reel', usage: '†fbdl [facebook-url]',
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const url = args[0];
        if (!url) return ctx.reply(`❌ Provide a Facebook URL.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const res  = await axios.get(`https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(url)}`);
            const data = res.data?.data || res.data;
            const link = data?.url || data?.video || data?.download;
            if (!link) throw new Error('No download link found');
            const media = await axios.get(link, { responseType: 'arraybuffer' });
            await sock.sendMessage(ctx.from, { video: Buffer.from(media.data), caption: `🎬 Facebook Video${s.FOOTER}` }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Download failed: ${e.message}${s.FOOTER}`); }
    }
};

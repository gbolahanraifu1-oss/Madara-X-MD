const axios = require('axios');
module.exports = {
    name: 'twdl', aliases: ['twitterdownload','xdownload','xvideo2'], category: 'media',
    desc: 'Download X/Twitter video or media', usage: '†twdl [twitter-url]',
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const url = args[0];
        if (!url) return ctx.reply(`❌ Provide a Twitter/X URL.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const res  = await axios.get(`https://api.siputzx.my.id/api/d/twitter?url=${encodeURIComponent(url)}`);
            const data = res.data?.data || res.data;
            const link = data?.url || data?.video || data?.download;
            if (!link) throw new Error('No download link found');
            const media = await axios.get(link, { responseType: 'arraybuffer' });
            await sock.sendMessage(ctx.from, { video: Buffer.from(media.data), caption: `🎬 Twitter/X Video${s.FOOTER}` }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Download failed: ${e.message}${s.FOOTER}`); }
    }
};

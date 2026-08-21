const axios = require('axios');
module.exports = {
    name: 'generaldl', aliases: ['autodl','anydownload','autodownload'], category: 'media',
    desc: 'Auto-detect and download from any supported URL', usage: '†generaldl [url]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings; const url = args[0];
        if (!url) return ctx.reply(`❌ Provide a URL (YouTube, TikTok, Instagram, Twitter, Facebook, etc.)${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const res  = await axios.get(`https://api.siputzx.my.id/api/d/auto?url=${encodeURIComponent(url)}`);
            const data = res.data?.data || res.data;
            const link = data?.url || data?.video || data?.audio || data?.download;
            if (!link) throw new Error('Platform not supported or no media found');
            const media = await axios.get(link, { responseType: 'arraybuffer' });
            await sock.sendMessage(ctx.from, { video: Buffer.from(media.data), caption: `🎬 Downloaded!${s.FOOTER}` }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

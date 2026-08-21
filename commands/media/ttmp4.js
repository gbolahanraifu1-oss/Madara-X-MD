const axios = require('axios');
module.exports = {
    name: 'ttmp4', aliases: ['tiktokmp4','tiktoknomark','ttnowm'], category: 'media',
    desc: 'TikTok MP4 without watermark', usage: '†ttmp4 [tiktok-url]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings; const url = args[0];
        if (!url) return ctx.reply(`❌ Provide a TikTok URL.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const res  = await axios.get(`https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`);
            const link = res.data?.data?.url || res.data?.data?.video;
            if (!link) throw new Error('No download link');
            const media = await axios.get(link, { responseType: 'arraybuffer' });
            await sock.sendMessage(ctx.from, { video: Buffer.from(media.data), caption: `🎬 TikTok (No Watermark)${s.FOOTER}` }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

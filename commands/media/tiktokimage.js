const axios = require('axios');
module.exports = {
    name: 'tiktokimage',
    aliases: ['ttimage', 'ttslidedl'],
    category: 'media',
    desc: 'Download TikTok slideshow/image post',
    usage: '†tiktokimage [url]',
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const url = args[0];
        if (!url?.includes('tiktok')) return ctx.reply(`❌ Provide a TikTok URL.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const res  = await axios.get(`https://api.tiklydown.eu.org/api/download/v2?url=${encodeURIComponent(url)}`);
            const data = res.data;
            const images = data?.images || data?.data?.images || [];
            if (!images.length) {
                // Not a slideshow — fall back to video
                return ctx.reply(`❌ No images found. Try \`${ctx.settings.prefix}ttdl\` for videos.${s.FOOTER}`);
            }
            await ctx.reply(`🖼️ *Found ${images.length} image(s) — downloading...*`);
            for (const imgUrl of images.slice(0, 5)) {
                try {
                    const img = await axios.get(imgUrl, { responseType: 'arraybuffer' });
                    await sock.sendMessage(ctx.from, { image: Buffer.from(img.data), caption: s.FOOTER }, { quoted: msg });
                } catch {}
            }
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

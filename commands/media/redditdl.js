const axios = require('axios');
module.exports = {
    name: 'redditdl',
    aliases: ['reddit', 'redditvideo'],
    category: 'media',
    desc: 'Download Reddit video or image post',
    usage: '†redditdl [url]',
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const url = args[0];
        if (!url?.includes('reddit.com')) return ctx.reply(`❌ Provide a Reddit post URL.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const jsonUrl = url.replace(/\/?$/, '.json');
            const res  = await axios.get(jsonUrl, { headers: { 'User-Agent': 'MADARABot/1.0' } });
            const post = res.data[0]?.data?.children[0]?.data;
            if (!post) throw new Error('Post not found');
            const videoUrl = post.secure_media?.reddit_video?.fallback_url
                || post.media?.reddit_video?.fallback_url;
            const imgUrl = post.url;
            if (videoUrl) {
                const vid = await axios.get(videoUrl, { responseType: 'arraybuffer' });
                await sock.sendMessage(ctx.from, { video: Buffer.from(vid.data), caption: `📹 ${post.title}${s.FOOTER}` }, { quoted: msg });
            } else if (imgUrl?.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
                const img = await axios.get(imgUrl, { responseType: 'arraybuffer' });
                await sock.sendMessage(ctx.from, { image: Buffer.from(img.data), caption: `🖼️ ${post.title}${s.FOOTER}` }, { quoted: msg });
            } else {
                ctx.reply(`📝 *${post.title}*\n\n${post.selftext?.slice(0, 500) || 'No text content.'}${s.FOOTER}`);
            }
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

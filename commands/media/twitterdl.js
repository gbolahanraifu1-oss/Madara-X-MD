const axios = require('axios');
module.exports = {
    name: 'twitterdl', aliases: ['fulltw','xdl','fulltwitter'], category: 'media',
    desc: 'Full Twitter/X downloader', usage: '†twitterdl [twitter-url]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings; const url = args[0];
        if (!url) return ctx.reply(`❌ Provide a Twitter/X URL.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const res  = await axios.get(`https://api.siputzx.my.id/api/d/twitter?url=${encodeURIComponent(url)}`);
            const link = res.data?.data?.url || res.data?.data?.video;
            if (!link) throw new Error('No download link');
            const media = await axios.get(link, { responseType: 'arraybuffer' });
            await sock.sendMessage(ctx.from, { video: Buffer.from(media.data), caption: `🎬 Twitter/X${s.FOOTER}` }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

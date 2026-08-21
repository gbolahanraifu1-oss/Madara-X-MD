const axios = require('axios');
module.exports = {
    name: 'fbdlmp3',
    aliases: ['fbmp3','fbaudio','fbmusic'],
    category: 'media',
    desc: 'Facebook audio only',
    usage: '†fbdlmp3 [url]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const url = args[0];
        if (!url) return ctx.reply(`❌ Provide a Facebook URL.\nUsage: \`${s.prefix}fbdlmp3 [url]\`${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const res  = await axios.get(`https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(url)}`);
            const data = res.data?.data || res.data;
            const link = data?.url || data?.video || data?.audio || data?.download;
            if (!link) throw new Error('No download link found');
            const media = await axios.get(link, { responseType: 'arraybuffer' });
            const buf   = Buffer.from(media.data);
            if (true) {
                await sock.sendMessage(ctx.from, { audio: buf, mimetype: 'audio/mp4', ptt: false }, { quoted: msg });
            } else {
                await sock.sendMessage(ctx.from, { video: buf, caption: `🎬 Downloaded from Facebook${s.FOOTER}` }, { quoted: msg });
            }
        } catch (e) { ctx.reply(`❌ Download failed: ${e.message}${s.FOOTER}`); }
    }
};

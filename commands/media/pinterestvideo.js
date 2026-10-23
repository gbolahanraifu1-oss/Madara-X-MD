const pinterest = require('../../lib/pinterestApi');
module.exports = {
    name: 'pinterestvideo',
    aliases: ['pinvid','pinterestv'],
    category: 'media',
    desc: 'Download Pinterest video',
    usage: '†pinterestvideo [url]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const url = args[0];
        if (!url) return ctx.reply(`❌ Provide a Pinterest URL.\nUsage: \`${s.prefix}pinterestvideo [url]\`${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const pin = await pinterest.getPinterestPin(url);
            if (!pin.videoUrl) throw new Error('That pin has no progressive MP4 video to download.');
            await sock.sendMessage(ctx.from, {
                video: { url: pin.videoUrl },
                caption: `🎬 ${pin.title}\n${pin.url}${s.FOOTER}`,
            }, { quoted: msg });
        } catch (e) { return ctx.reply(`❌ Download failed: ${e.message}${s.FOOTER}`); }
    }
};

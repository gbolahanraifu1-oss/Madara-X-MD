module.exports = {
    name: 'channel',
    aliases: ['ytchannel', 'channeldl', 'latestytvid'],
    category: 'media',
    desc: 'Get latest video from a YouTube channel',
    usage: '†channel [channel name or @handle]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args.join(' ');
        if (!q) return ctx.reply(`❌ Usage: \`${s.prefix}channel [channel name]\`${s.FOOTER}`);
        await ctx.react('📺');
        try {
            const yts  = require('yt-search');
            const res  = await yts({ query: q, pages: 1 });
            const top  = res.videos[0];
            if (!top) return ctx.reply(`❌ No videos found for *${q}*.${s.FOOTER}`);
            ctx.reply(`📺 *Latest from "${q}":*\n\n*${top.title}*\n⏱ ${top.timestamp} | 👁 ${top.views}\n🔗 ${top.url}\n\nDownload: \`${s.prefix}ytdl ${top.url}\`${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

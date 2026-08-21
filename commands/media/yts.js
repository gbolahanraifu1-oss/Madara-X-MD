module.exports = {
    name: 'yts',
    aliases: ['youtubesearch', 'ysearch'],
    category: 'media',
    desc: 'YouTube quick search — shows top result',
    usage: '†yts [query]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args.join(' ');
        if (!q) return ctx.reply(`❌ Usage: \`${s.prefix}yts [query]\`${s.FOOTER}`);
        await ctx.react('🔍');
        try {
            const yts = require('yt-search');
            const r   = await yts(q);
            const top = r.videos[0];
            if (!top) return ctx.reply(`❌ No results for *${q}*.${s.FOOTER}`);
            ctx.reply(`🎬 *Top YouTube Result:*\n\n*${top.title}*\n⏱ ${top.timestamp} | 👁 ${top.views} views\n👤 ${top.author.name}\n🔗 ${top.url}\n\nDownload: \`${s.prefix}ytdl ${top.url}\`${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Search failed: ${e.message}${s.FOOTER}`); }
    }
};

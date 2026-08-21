module.exports = {
    name: 'ytsearch', aliases: ['youtubesearch2','yssearch'], category: 'media',
    desc: 'Search YouTube and show top 5 results', usage: '†ytsearch [query]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args.join(' ');
        if (!q) return ctx.reply(`❌ Usage: \`${s.prefix}ytsearch [query]\`${s.FOOTER}`);
        await ctx.react('🔍');
        try {
            const yts  = require('yt-search');
            const res  = await yts(q);
            const list = res.videos.slice(0, 5).map((v, i) =>
                `${i+1}. *${v.title}*\n   ⏱ ${v.timestamp} | 👁 ${v.views}\n   🔗 ${v.url}`
            ).join('\n\n');
            ctx.reply(`🔍 *YouTube: "${q}"*\n\n${list}\n\nDownload: \`${s.prefix}ytdl [url]\`${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Search failed: ${e.message}${s.FOOTER}`); }
    }
};

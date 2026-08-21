module.exports = {
    name: 'video', aliases: ['searchvideo','dlvideo','getvideo'], category: 'media',
    desc: 'Search and download video by query', usage: '†video [query]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings; const q = args.join(' ');
        if (!q) return ctx.reply(`❌ Usage: \`${s.prefix}video [query]\`${s.FOOTER}`);
        await ctx.react('🎬');
        try {
            const yts  = require('yt-search'); const ytdl = require('@distube/ytdl-core');
            const res  = await yts(q); const top = res.videos[0];
            if (!top) return ctx.reply(`❌ No results for *${q}*.${s.FOOTER}`);
            const stream = ytdl(top.url, { quality: 'highest', filter: 'videoandaudio' });
            const chunks = []; stream.on('data', c => chunks.push(c));
            await new Promise((res, rej) => { stream.on('end', res); stream.on('error', rej); });
            await sock.sendMessage(ctx.from, { video: Buffer.concat(chunks), caption: `🎬 ${top.title}${s.FOOTER}` }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

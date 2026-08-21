module.exports = {
    name: 'shorts',
    aliases: ['ytshorts', 'short', 'ytshort'],
    category: 'media',
    desc: 'Download YouTube Shorts',
    usage: '†shorts [youtube-shorts-url]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const url = args[0];
        if (!url) return ctx.reply(`❌ Usage: \`${s.prefix}shorts [youtube-shorts-url]\`${s.FOOTER}`);
        const normalized = url.replace('/shorts/', '/watch?v=');
        await ctx.react('⏳');
        try {
            const ytdl = require('@distube/ytdl-core');
            const stream = ytdl(normalized, { quality: 'highest', filter: 'videoandaudio' });
            const chunks = [];
            stream.on('data', c => chunks.push(c));
            await new Promise((res, rej) => { stream.on('end', res); stream.on('error', rej); });
            await sock.sendMessage(ctx.from, { video: Buffer.concat(chunks), caption: `🩳 YouTube Short${s.FOOTER}` }, { quoted: msg });
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

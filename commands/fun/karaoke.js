const axios = require('axios');
module.exports = {
    name: 'karaoke',
    aliases: ['singalong', 'lyrics2'],
    category: 'fun',
    desc: 'Get song lyrics formatted for karaoke/singalong',
    usage: '†karaoke [song name]',
    async execute(sock, msg, args, ctx) {
        const s     = ctx.settings;
        const query = ctx.text;
        if (!query) return ctx.reply(`❌ Provide a song name.\n_Usage: ${s.prefix}karaoke Shape of You_${s.FOOTER}`);
        await ctx.react('🎤');
        try {
            const res  = await axios.get(`https://some-random-api.com/others/lyrics?title=${encodeURIComponent(query)}`);
            const d    = res.data;
            if (!d?.lyrics) throw new Error('Not found');
            const lines = d.lyrics.split('\n').filter(l => l.trim());
            // Format with karaoke style
            const formatted = lines.slice(0, 30).map(l => `♪ ${l}`).join('\n');
            ctx.reply(
                `🎤 *${d.title || query}*\n_by ${d.author || 'Unknown'}_\n\n` +
                `*╭─── KARAOKE ───⊷*\n${formatted}\n*╰───────────────⊷*` +
                `${lines.length > 30 ? `\n_...${lines.length - 30} more lines_` : ''}${s.FOOTER}`
            );
        } catch { ctx.reply(`❌ Lyrics not found for *${query}*.${s.FOOTER}`); }
    }
};

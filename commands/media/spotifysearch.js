const axios = require('axios');
module.exports = {
    name: 'spotifysearch', aliases: ['spsearch','spotfind'], category: 'media',
    desc: 'Search Spotify tracks', usage: '†spotifysearch [query]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings; const q = args.join(' ');
        if (!q) return ctx.reply(`❌ Usage: \`${s.prefix}spotifysearch [query]\`${s.FOOTER}`);
        await ctx.react('🔍');
        try {
            const res  = await axios.get(`https://api.siputzx.my.id/api/s/spotify?q=${encodeURIComponent(q)}`);
            const data = res.data?.data;
            if (!data?.length) return ctx.reply(`❌ No Spotify results for *${q}*.${s.FOOTER}`);
            const list = data.slice(0,5).map((t,i) => `${i+1}. *${t.name||t.title}* — ${t.artist||''}\n   🔗 ${t.url||t.link||'N/A'}`).join('\n\n');
            ctx.reply(`🎵 *Spotify: "${q}"*\n\n${list}\n\nUse link with \`${s.prefix}spotifymp3\`${s.FOOTER}`);
        } catch (e) { ctx.reply(`❌ Search failed: ${e.message}${s.FOOTER}`); }
    }
};

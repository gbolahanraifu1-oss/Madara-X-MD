const axios = require('axios');
module.exports = { name: 'imdb', aliases: ['imdbsearch','moviedb','tvshow'], category: 'search', desc: 'Movie/TV detailed info via IMDB', usage: '†imdb [movie or show name]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const q=args.join(' '); if(!q) return ctx.reply(`❌ Usage: \`${s.prefix}imdb Inception\`${s.FOOTER}`);
        await ctx.react('🎬');
        try {
            const res=await axios.get(`https://www.omdbapi.com/?s=${encodeURIComponent(q)}&apikey=thewdb`);
            const top=res.data?.Search?.[0];
            if (!top) { const res2=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Provide IMDB-style info for: ${q}. Include: year, genre, director, cast, plot, rating.`)}`); return ctx.reply(`🎬 *IMDB Search: "${q}"*\n\n${res2.data?.data||'No results.'}${s.FOOTER}`); }
            const detail=await axios.get(`https://www.omdbapi.com/?i=${top.imdbID}&apikey=thewdb`);
            const d=detail.data;
            ctx.reply(`🎬 *${d.Title}* (${d.Year})\n*╭──────────────────⊷*\n*┋ 🎭 Genre:* ${d.Genre||'N/A'}\n*┋ 🎬 Director:* ${d.Director||'N/A'}\n*┋ ⭐ Rating:* ${d.imdbRating||'N/A'}/10\n*┋ ⏱ Runtime:* ${d.Runtime||'N/A'}\n*┋ 📝 Plot:* ${(d.Plot||'').slice(0,100)}...\n*╰──────────────────⊷*${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ IMDB failed: ${e.message}${s.FOOTER}`);}
    }
};

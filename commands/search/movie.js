const axios = require('axios');
module.exports = { name: 'movie', aliases: ['moviesearch','findmovie','film'], category: 'search', desc: 'Search movie info', usage: '†movie [title]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const q=args.join(' '); if(!q) return ctx.reply(`❌ Usage: \`${s.prefix}movie Inception\`${s.FOOTER}`);
        await ctx.react('🎬');
        try { const res=await axios.get(`https://www.omdbapi.com/?s=${encodeURIComponent(q)}&apikey=thewdb`); const top=res.data?.Search?.[0]; if(!top){const r2=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Give movie info for: ${q}. Include: year, director, cast, plot, rating.`)}`);return ctx.reply(`🎬 *Movie: "${q}"*\n\n${r2.data?.data||'No results.'}${s.FOOTER}`);}
        const detail=await axios.get(`https://www.omdbapi.com/?i=${top.imdbID}&apikey=thewdb`); const d=detail.data;
        ctx.reply(`🎬 *${d.Title}* (${d.Year})\n*╭──────────────────⊷*\n*┋ 🎭 Genre:* ${d.Genre||'N/A'}\n*┋ 🎬 Director:* ${d.Director||'N/A'}\n*┋ ⭐ Rating:* ${d.imdbRating||'N/A'}/10\n*┋ 📝 Plot:* ${(d.Plot||'').slice(0,120)}\n*╰──────────────────⊷*${s.FOOTER}`); }
        catch(e){ctx.reply(`❌ Movie search failed: ${e.message}${s.FOOTER}`);}
    }
};

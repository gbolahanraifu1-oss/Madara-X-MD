const axios = require('axios');
const { menuBox } = require('../../lib/menuBox');
module.exports = { name: 'movie', aliases: ['moviesearch','findmovie','film'], category: 'search', desc: 'Search movie info', usage: '†movie [title]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const q=args.join(' '); if(!q) return ctx.reply(`❌ Usage: \`${s.prefix}movie Inception\`${s.FOOTER}`);
        await ctx.react('🎬');
        try {
            const res=await axios.get(`https://www.omdbapi.com/?s=${encodeURIComponent(q)}&apikey=thewdb`);
            const top=res.data?.Search?.[0];
            if(!top){
                const r2=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Give movie info for: ${q}. Include: year, director, cast, plot, rating.`)}`);
                return ctx.reply(menuBox('🎬', `ᴍᴏᴠɪᴇ: ${q}`, [r2.data?.data||'No results.']) + s.FOOTER);
            }
            const detail=await axios.get(`https://www.omdbapi.com/?i=${top.imdbID}&apikey=thewdb`); const d=detail.data;
            ctx.reply(menuBox('🎬', `${d.Title} (${d.Year})`, [
                `*Genre:* ${d.Genre||'N/A'}`,
                `*Director:* ${d.Director||'N/A'}`,
                `*Rating:* ${d.imdbRating||'N/A'}/10`,
                `*Plot:* ${(d.Plot||'').slice(0,120)}`,
            ]) + s.FOOTER);
        }
        catch(e){ctx.reply(`❌ Movie search failed: ${e.message}${s.FOOTER}`);}
    }
};

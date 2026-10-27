const axios = require('axios');
const { menuBox } = require('../../lib/menuBox');
module.exports = { name: 'imdb', aliases: ['imdbsearch','moviedb','tvshow'], category: 'search', desc: 'Movie/TV detailed info via IMDB', usage: '†imdb [movie or show name]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const q=args.join(' '); if(!q) return ctx.reply(`❌ Usage: \`${s.prefix}imdb Inception\`${s.FOOTER}`);
        await ctx.react('🎬');
        try {
            const res=await axios.get(`https://www.omdbapi.com/?s=${encodeURIComponent(q)}&apikey=thewdb`);
            const top=res.data?.Search?.[0];
            if (!top) {
                const res2=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Provide IMDB-style info for: ${q}. Include: year, genre, director, cast, plot, rating.`)}`);
                return ctx.reply(menuBox('🎬', `ɪᴍᴅʙ sᴇᴀʀᴄʜ: ${q}`, [res2.data?.data||'No results.']) + s.FOOTER);
            }
            const detail=await axios.get(`https://www.omdbapi.com/?i=${top.imdbID}&apikey=thewdb`);
            const d=detail.data;
            // Title goes in the box header (not asterisk-wrapped) — a title
            // containing its own '*' character used to break WhatsApp's bold
            // parsing for the entire message.
            ctx.reply(menuBox('🎬', `${d.Title} (${d.Year})`, [
                `*Genre:* ${d.Genre||'N/A'}`,
                `*Director:* ${d.Director||'N/A'}`,
                `*Rating:* ${d.imdbRating||'N/A'}/10`,
                `*Runtime:* ${d.Runtime||'N/A'}`,
                `*Plot:* ${(d.Plot||'').slice(0,100)}...`,
            ]) + s.FOOTER);
        } catch(e){ctx.reply(`❌ IMDB failed: ${e.message}${s.FOOTER}`);}
    }
};

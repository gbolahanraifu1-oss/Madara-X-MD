const axios = require('axios');
module.exports = { name: 'lyricsearch', aliases: ['findlyrics','searchlyrics','getlyrics2'], category: 'search', desc: 'Advanced lyrics finder', usage: '†lyricsearch [song] - [artist?]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const q=args.join(' '); if(!q) return ctx.reply(`❌ Usage: \`${s.prefix}lyricsearch Bohemian Rhapsody - Queen\`${s.FOOTER}`);
        await ctx.react('🎵');
        try {
            const res=await axios.get(`https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(`Find lyrics info for: ${q}. Provide: artist, album, year, and a brief description of the song's meaning. Do NOT reproduce full lyrics (copyright).`)}`);
            ctx.reply(`🎵 *Lyrics Search: "${q}"*\n\n${res.data?.data||'No lyrics info found.'}${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};

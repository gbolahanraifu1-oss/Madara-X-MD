const axios = require('axios');
module.exports = { name: 'meme', aliases: ['randommeme','getmeme','memefetch'], category: 'misc', desc: 'Random meme from Reddit', usage: '†meme [subreddit?]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const sub=args[0]||'memes'; await ctx.react('😂');
        try { const res=await axios.get(`https://meme-api.com/gimme/${sub}`); const data=res.data; if(!data?.url) throw new Error('No meme'); const img=await axios.get(data.url,{responseType:'arraybuffer'}); await sock.sendMessage(ctx.from,{image:Buffer.from(img.data),caption:`😂 *${data.title}*\n👍 ${data.ups} | r/${data.subreddit}${s.FOOTER}`},{quoted:msg}); }
        catch(e){ctx.reply(`❌ Meme failed: ${e.message}${s.FOOTER}`);}
    }
};

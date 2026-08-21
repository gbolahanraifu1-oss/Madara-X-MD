const axios = require('axios');
module.exports = { name: 'insult', aliases: ['comicinsult','roastword'], category: 'misc', desc: 'Get a funny comic insult', usage: '†insult [@user?]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const m=ctx.getMentions?.()??[]; const target=m[0]?.split('@')[0]||ctx.sender.split('@')[0]; await ctx.react('💬');
        try { const res=await axios.get('https://evilinsult.com/generate_insult.php?lang=en&type=json'); ctx.reply(`💬 @${target}: _${res.data?.insult||"You're the reason the gene pool needs a lifeguard."}_${s.FOOTER}`,{mentions:m.length?m:[ctx.sender]}); }
        catch{ctx.reply(`💬 @${target}: _You bring everyone such joy when you leave the room._${s.FOOTER}`,{mentions:m.length?m:[ctx.sender]});}
    }
};

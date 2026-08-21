const axios = require('axios');
module.exports = { name: 'thisdoesnotexist', aliases: ['fakeperson','aiperson','generatedface'], category: 'misc', desc: 'Generate a fake AI face', usage: '†thisdoesnotexist',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; await ctx.react('🤖');
        try { const res=await axios.get('https://thispersondoesnotexist.com/',{responseType:'arraybuffer',headers:{'User-Agent':'Mozilla/5.0'}}); await sock.sendMessage(ctx.from,{image:Buffer.from(res.data),caption:`🤖 *This Person Does Not Exist* — AI Generated${s.FOOTER}`},{quoted:msg}); }
        catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};

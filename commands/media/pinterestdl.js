const axios = require('axios');
module.exports = { name: 'pinterestdl', aliases: ['pinterest','pindl','pindownload'], category: 'media', desc: 'Download Pinterest media', usage: '†pinterestdl [pinterest-url]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const url=args[0]; if(!url) return ctx.reply(`❌ Provide a Pinterest URL.${s.FOOTER}`);
        await ctx.react('⏳');
        try { const res=await axios.get(`https://api.siputzx.my.id/api/d/pinterest?url=${encodeURIComponent(url)}`); const data=res.data?.data||res.data; const link=data?.url||data?.image||data?.video; if(!link) throw new Error('No media found'); const media=await axios.get(link,{responseType:'arraybuffer'}); await sock.sendMessage(ctx.from,{image:Buffer.from(media.data),caption:`📌 Pinterest${s.FOOTER}`},{quoted:msg}); }
        catch(e){ctx.reply(`❌ Download failed: ${e.message}${s.FOOTER}`);}
    }
};

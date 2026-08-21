const axios = require('axios');
module.exports = { name: 'igdl', aliases: ['instagramdl2','igdown','igdownload'], category: 'media', desc: 'Download Instagram post/reel/story', usage: '†igdl [instagram-url]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const url=args[0]; if(!url||!url.includes('instagram.com')) return ctx.reply(`❌ Provide a valid Instagram URL.${s.FOOTER}`);
        await ctx.react('⏳');
        try { const res=await axios.get(`https://api.siputzx.my.id/api/d/instagram?url=${encodeURIComponent(url)}`); const data=res.data?.data; const link=data?.url||data?.video||data?.image; if(!link) throw new Error('No media found'); const media=await axios.get(link,{responseType:'arraybuffer'}); const buf=Buffer.from(media.data); const isVid=link.includes('.mp4')||data?.video; if(isVid) await sock.sendMessage(ctx.from,{video:buf,caption:`🎬 Instagram${s.FOOTER}`},{quoted:msg}); else await sock.sendMessage(ctx.from,{image:buf,caption:`📸 Instagram${s.FOOTER}`},{quoted:msg}); }
        catch(e){ctx.reply(`❌ Download failed: ${e.message}${s.FOOTER}`);}
    }
};

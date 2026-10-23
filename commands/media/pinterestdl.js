const pinterest = require('../../lib/pinterestApi');
module.exports = { name: 'pinterestdl', aliases: ['pindl','pindownload'], category: 'media', desc: 'Download an image or video from a Pinterest pin', usage: '†pinterestdl [pinterest-url]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const url=args[0]; if(!url) return ctx.reply(`❌ Provide a Pinterest URL.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const pin=await pinterest.getPinterestPin(url);
            const caption=`📌 ${pin.title}\n${pin.url}${s.FOOTER}`;
            if(pin.videoUrl) return await sock.sendMessage(ctx.from,{video:{url:pin.videoUrl},caption},{quoted:msg});
            if(!pin.imageUrl) throw new Error('No downloadable image found on that pin.');
            return await sock.sendMessage(ctx.from,{image:{url:pin.imageUrl},caption},{quoted:msg});
        } catch(e){return ctx.reply(`❌ Download failed: ${e.message}${s.FOOTER}`);}
    }
};

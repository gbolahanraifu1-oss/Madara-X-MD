'use strict';
const pinterest = require('../../lib/pinterestApi');
module.exports = {
    name:'pinterest',aliases:['pin','pintdl'],category:'media',desc:'Search Pinterest or send a pin image/video',usage:'†pinterest <query or pin URL>',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,q=args.join(' ');
        if(!q)return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}pinterest anime girl${s.FOOTER}`);
        await ctx.react('⏳');
        try{
            if(/^https?:\/\//i.test(q) || /^(?:www\.)?(?:pinterest\.com|pin\.it)\//i.test(q)){
                const pin=await pinterest.getPinterestPin(q);
                return sendPin(sock,msg,ctx,pin);
            }
            const pins=await pinterest.searchPinterestPins(q,4);
            if(!pins.length)throw new Error('No Pinterest pins with downloadable media were found.');
            for(let i=0;i<pins.length;i++){
                await sendPin(sock,msg,ctx,pins[i],i===0);
            }
        }catch(e){await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`);}
    }
};

async function sendPin(sock,msg,ctx,pin,quoted=true){
    const s=ctx.settings;
    const caption=`📌 ${pin.title}\n${pin.url}${s.FOOTER}`;
    const options=quoted&&msg?{quoted:msg}:{};
    if(pin.videoUrl){
        return sock.sendMessage(ctx.from,{video:{url:pin.videoUrl},caption},options);
    }
    if(!pin.imageUrl)throw new Error('This Pinterest pin has no downloadable image.');
    return sock.sendMessage(ctx.from,{image:{url:pin.imageUrl},caption},options);
}

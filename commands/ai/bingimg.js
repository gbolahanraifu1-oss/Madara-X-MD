'use strict';
const axios=require('axios');
module.exports = {
    name:'bing',aliases:['bingimage','bingai'],category:'ai',desc:'ʙɪɴɢ ɪᴍᴀɢᴇ sᴇᴀʀᴄʜ',usage:'†bing <query>',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,q=args.join(' ');
        if(!q)return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}bing anime wallpaper${s.FOOTER}`);
        await ctx.react('⏳');
        try{
            const res=await axios.get(`https://api.dreaded.site/api/bing/images?query=${encodeURIComponent(q)}`);
            const imgs=res.data?.result?.slice(0,4);
            if(!imgs?.length)throw new Error('ɴᴏ ɪᴍᴀɢᴇs');
            for(const img of imgs){
                await sock.sendMessage(ctx.from,{image:{url:img.url||img},caption:`🔍 ${q}${s.FOOTER}`},{quoted:msg});
            }
        }catch(e){await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`);}
    }
};

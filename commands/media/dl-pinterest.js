'use strict';
const axios=require('axios');
module.exports = {
    name:'pinterest',aliases:['pin','pintdl'],category:'media',desc:'ᴅᴏᴡɴʟᴏᴀᴅ ᴘɪɴᴛᴇʀᴇsᴛ ɪᴍᴀɢᴇ',usage:'†pinterest <query or url>',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,q=args.join(' ');
        if(!q)return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}pinterest anime girl${s.FOOTER}`);
        await ctx.react('⏳');
        try{
            if(q.startsWith('http')){
                const res=await axios.get(`https://api.dreaded.site/api/pinterestdl?url=${encodeURIComponent(q)}`);
                const img=res.data?.result?.url||res.data?.url;
                if(!img)throw new Error('ɴᴏ ɪᴍᴀɢᴇ');
                return sock.sendMessage(ctx.from,{image:{url:img},caption:`📌${s.FOOTER}`},{quoted:msg});
            }
            const res=await axios.get(`https://api.dreaded.site/api/pinterest?search=${encodeURIComponent(q)}`);
            const imgs=res.data?.result?.slice(0,4);
            if(!imgs?.length)throw new Error('ɴᴏ ʀᴇsᴜʟᴛs');
            for(const img of imgs){
                await sock.sendMessage(ctx.from,{image:{url:img.url||img},caption:`📌 ${q}${s.FOOTER}`},{quoted:msg});
            }
        }catch(e){await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`);}
    }
};

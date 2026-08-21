'use strict';
const axios=require('axios');
module.exports = {
    name:'twitter',aliases:['tw','twdl','xdl','xvideo'],category:'media',desc:'ᴅᴏᴡɴʟᴏᴀᴅ ᴛᴡɪᴛᴛᴇʀ/x ᴠɪᴅᴇᴏ',usage:'†twitter <url>',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,url=args[0];
        if(!url)return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}twitter <url>${s.FOOTER}`);
        await ctx.react('⏳');
        try{
            const res=await axios.get(`https://api.dreaded.site/api/twitter?url=${encodeURIComponent(url)}`);
            const d=res.data?.result||res.data;
            const vurl=d?.url||d?.video_url||d?.media?.[0]?.url;
            if(!vurl)throw new Error('ɴᴏ ᴠɪᴅᴇᴏ');
            await sock.sendMessage(ctx.from,{video:{url:vurl},mimetype:'video/mp4',caption:`🐦 ᴛᴡɪᴛᴛᴇʀ/x${s.FOOTER}`},{quoted:msg});
        }catch(e){await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`);}
    }
};

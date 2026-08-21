'use strict';
const axios=require('axios');
module.exports = {
    name:'instagram',aliases:['ig','igdl','igdownload'],category:'media',desc:'ᴅᴏᴡɴʟᴏᴀᴅ ɪɴsᴛᴀɢʀᴀᴍ',usage:'†ig <url>',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,url=args[0];
        if(!url)return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}ig <url>${s.FOOTER}`);
        await ctx.react('⏳');
        try{
            const res=await axios.get(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`);
            const data=res.data?.data;
            if(!data?.length)throw new Error('ɴᴏ ᴍᴇᴅɪᴀ ғᴏᴜɴᴅ');
            for(const item of data.slice(0,4)){
                const isVid=item.type==='video'||item.url?.includes('.mp4');
                await sock.sendMessage(ctx.from,isVid?{video:{url:item.url},mimetype:'video/mp4',caption:`📸${s.FOOTER}`}:{image:{url:item.url},caption:`📸${s.FOOTER}`},{quoted:msg});
            }
        }catch(e){await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`);}
    }
};

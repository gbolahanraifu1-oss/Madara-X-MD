'use strict';
const axios=require('axios');
module.exports = {
    name:'facebook',aliases:['fb','fbdl','fbvideo'],category:'media',desc:'ᴅᴏᴡɴʟᴏᴀᴅ ғᴀᴄᴇʙᴏᴏᴋ ᴠɪᴅᴇᴏ',usage:'†facebook <url>',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,url=args[0];
        if(!url)return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}facebook <url>${s.FOOTER}`);
        await ctx.react('⏳');
        try{
            const res=await axios.get(`https://api.dreaded.site/api/fbdl?url=${encodeURIComponent(url)}`);
            const d=res.data?.result;
            if(!d?.hd&&!d?.sd)throw new Error('ɴᴏ ᴠɪᴅᴇᴏ ғᴏᴜɴᴅ');
            await sock.sendMessage(ctx.from,{video:{url:d.hd||d.sd},mimetype:'video/mp4',caption:`📘 ғᴀᴄᴇʙᴏᴏᴋ ᴠɪᴅᴇᴏ${s.FOOTER}`},{quoted:msg});
        }catch(e){await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`);}
    }
};

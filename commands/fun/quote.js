'use strict';
const axios=require('axios');
module.exports={name:'quote',aliases:['inspire','motivation'],category:'fun',desc:'ɢᴇᴛ ᴀ ᴍᴏᴛɪᴠᴀᴛɪᴏɴᴀʟ ǫᴜᴏᴛᴇ',usage:'†quote',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings;
        try{
            const res=await axios.get('https://zenquotes.io/api/random');
            const q=res.data?.[0];
            await ctx.reply(`💭 *"${q.q}"*\n\n— _${q.a}_${s.FOOTER}`);
        }catch(e){await ctx.reply(`💭 *"ᴛʜᴇ ᴏɴʟʏ ᴡᴀʏ ᴛᴏ ᴅᴏ ɢʀᴇᴀᴛ ᴡᴏʀᴋ ɪs ᴛᴏ ʟᴏᴠᴇ ᴡʜᴀᴛ ʏᴏᴜ ᴅᴏ."*\n— _sᴛᴇᴠᴇ ᴊᴏʙs_${s.FOOTER}`);}
    }};

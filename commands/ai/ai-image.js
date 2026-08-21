'use strict';
const axios=require('axios');
module.exports = {
    name:'imagine',aliases:['aiimage','generate','gen'],category:'ai',desc:'ɢᴇɴᴇʀᴀᴛᴇ ᴀɪ ɪᴍᴀɢᴇ',usage:'†imagine <prompt>',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,q=args.join(' ');
        if(!q)return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}imagine a dragon on a mountain${s.FOOTER}`);
        await ctx.react('⏳');
        try{
            const res=await axios.get(`https://api.dreaded.site/api/imagine?prompt=${encodeURIComponent(q)}`,{responseType:'arraybuffer'});
            await sock.sendMessage(ctx.from,{image:Buffer.from(res.data),caption:`🎨 *${q}*${s.FOOTER}`},{quoted:msg});
        }catch(e){
            try{
                const r2=await axios.get(`https://image.pollinations.ai/prompt/${encodeURIComponent(q)}?width=512&height=512&nologo=true`,{responseType:'arraybuffer',timeout:30000});
                await sock.sendMessage(ctx.from,{image:Buffer.from(r2.data),caption:`🎨 *${q}*${s.FOOTER}`},{quoted:msg});
            }catch(e2){await ctx.reply(`❌ ɪᴍᴀɢᴇ ɢᴇɴ ғᴀɪʟᴇᴅ.${s.FOOTER}`);}
        }
    }
};

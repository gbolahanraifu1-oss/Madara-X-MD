'use strict';
module.exports={name:'dalle',aliases:['aiart', 'texttoimage', 'tti'],category:'ai',desc:'ɢᴇɴᴇʀᴀᴛᴇ ɪᴍᴀɢᴇ ғʀᴏᴍ ᴛᴇxᴛ',usage:'†dalle <prompt>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
        const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'dalle dragon'+s.FOOTER);
        await ctx.react('⏳');
        try{const r=await require('axios').get('https://image.pollinations.ai/prompt/'+encodeURIComponent(q)+'?width=512&height=512&nologo=true',{responseType:'arraybuffer',timeout:30000});
        await sock.sendMessage(ctx.from,{image:Buffer.from(r.data),caption:'🎨 *'+q+'*'+s.FOOTER},{quoted:msg});
        }catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

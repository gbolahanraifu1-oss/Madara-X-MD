'use strict';
module.exports={name:'lexica',aliases:['aiart2', 'stableart'],category:'ai',desc:'ʟᴇxɪᴄᴀ ᴀɪ ᴀʀᴛ ɢᴇɴᴇʀᴀᴛᴏʀ',usage:'†lexica <prompt>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
        const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'lexica anime girl'+s.FOOTER);
        await ctx.react('⏳');
        try{const r=await require('axios').get('https://lexica.art/api/v1/search?q='+encodeURIComponent(q));
        const imgs=r.data?.images?.slice(0,3);if(!imgs?.length)throw new Error('ɴᴏ ᴀʀᴛ ғᴏᴜɴᴅ');
        for(const img of imgs)await sock.sendMessage(ctx.from,{image:{url:img.src||img.srcSmall},caption:'🎨 '+q+s.FOOTER},{quoted:msg});
        }catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

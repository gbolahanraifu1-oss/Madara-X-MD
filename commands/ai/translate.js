'use strict';
module.exports={name:'translate',aliases:['tr', 'trans', 'tl'],category:'ai',desc:'ᴛʀᴀɴsʟᴀᴛᴇ ᴛᴇxᴛ',usage:'†translate <lang> <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
        const lang=args[0]||'en',text=args.slice(1).join(' ');
        if(!text)return ctx.reply('❌ *ᴜsᴀɢᴇ:* '+s.prefix+'translate es Hello'+s.FOOTER);
        try{const r=await require('axios').get('https://api.dreaded.site/api/translate?text='+encodeURIComponent(text)+'&lang='+lang);
        await ctx.reply('🌐 *ᴛʀᴀɴsʟᴀᴛɪᴏɴ:*\n\n'+( r.data?.result||r.data?.translated_text||'ᴇʀʀᴏʀ')+s.FOOTER);
        }catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

'use strict';
module.exports={name:'gemine',aliases:['gemini', 'bard'],category:'ai',desc:'ᴄʜᴀᴛ ᴡɪᴛʜ ɢᴇᴍɪɴɪ ᴀɪ',usage:'†gemine <prompt>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
        const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'gemine Hello'+s.FOOTER);
        await ctx.react('⏳');
        try{const r=await require('axios').get('https://api.dreaded.site/api/gemini?text='+encodeURIComponent(q));
        await ctx.reply('♊ *ɢᴇᴍɪɴɪ:*\n\n'+(r.data?.result||r.data?.message||'ɴᴏ ʀᴇsᴘᴏɴsᴇ.')+s.FOOTER);
        }catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

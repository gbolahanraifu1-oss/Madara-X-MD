'use strict';
const axios=require('axios');
module.exports={name:'story',aliases:['writestory','aiwrite','generate'],category:'ai',desc:'ᴀɪ sᴛᴏʀʏ ɢᴇɴᴇʀᴀᴛᴏʀ',usage:'†story <prompt>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'story a ninja in tokyo'+s.FOOTER);
await ctx.react('⏳');
try{const r=await require('axios').get('https://api.dreaded.site/api/gpt?text=Write+a+short+story+about:+'+encodeURIComponent(q));
await ctx.reply('📖 *ᴀɪ sᴛᴏʀʏ*\n\n'+(r.data?.result||r.data?.message||'ɴᴏ ʀᴇsᴘᴏɴsᴇ.')+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

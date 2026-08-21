'use strict';
const axios=require('axios');
module.exports={name:'essay',aliases:['writeessay','aiessay'],category:'ai',desc:'ᴀɪ ᴇssᴀʏ ᴡʀɪᴛᴇʀ',usage:'†essay <topic>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'essay climate change'+s.FOOTER);
await ctx.react('⏳');
try{const r=await require('axios').get('https://api.dreaded.site/api/gpt?text=Write+a+short+essay+about:+'+encodeURIComponent(q));
await ctx.reply('📝 *ᴀɪ ᴇssᴀʏ*\n\n'+(r.data?.result||r.data?.message||'ɴᴏ ʀᴇsᴘᴏɴsᴇ.')+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

'use strict';
const axios=require('axios');
module.exports={name:'roastai',aliases:['roast2','aiburn'],category:'ai',desc:'ᴀɪ ʀᴏᴀsᴛ',usage:'†roastai <name>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ')||ctx.pushName;
await ctx.react('⏳');
try{const r=await require('axios').get('https://api.dreaded.site/api/gpt?text=Roast+this+person+in+a+funny+way:+'+encodeURIComponent(q));
await ctx.reply('🔥 *ᴀɪ ʀᴏᴀsᴛ*\n\n'+(r.data?.result||r.data?.message||'ɴᴏ ʀᴇsᴘᴏɴsᴇ.')+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

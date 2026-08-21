'use strict';
const axios=require('axios');
module.exports={name:'bio',aliases:['writebio','aiprofile'],category:'ai',desc:'ᴀɪ ʙɪᴏ ɢᴇɴᴇʀᴀᴛᴏʀ',usage:'†bio <about you>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ')||'gamer and developer';
await ctx.react('⏳');
try{const r=await require('axios').get('https://api.dreaded.site/api/gpt?text=Write+a+short+social+media+bio+for:+'+encodeURIComponent(q));
await ctx.reply('👤 *ᴀɪ ʙɪᴏ*\n\n'+(r.data?.result||r.data?.message||'ɴᴏ ʀᴇsᴘᴏɴsᴇ.')+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

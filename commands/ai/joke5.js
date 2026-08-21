'use strict';
const axios=require('axios');
module.exports={name:'joke5',aliases:['aijoke','funnyai'],category:'ai',desc:'ᴀɪ ɢᴇɴᴇʀᴀᴛᴇᴅ ᴊᴏᴋᴇ',usage:'†joke5 <topic>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ')||'programmers';
await ctx.react('⏳');
try{const r=await require('axios').get('https://api.dreaded.site/api/gpt?text=Tell+me+a+funny+joke+about:+'+encodeURIComponent(q));
await ctx.reply('😂 *ᴀɪ ᴊᴏᴋᴇ*\n\n'+(r.data?.result||r.data?.message||'ɴᴏ ʀᴇsᴘᴏɴsᴇ.')+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

'use strict';
const axios=require('axios');
module.exports={name:'translit',aliases:['romanize','latinize'],category:'language',desc:'ᴛʀᴀɴsʟɪᴛᴇʀᴀᴛᴇ ᴛᴇxᴛ',usage:'†translit <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'translit Привет'+s.FOOTER);
try{const r=await require('axios').get('https://api.dreaded.site/api/transliterate?text='+encodeURIComponent(q));
await ctx.reply('🔤 *ᴛʀᴀɴsʟɪᴛ:* '+(r.data?.result||r.data?.text||'ɴ/ᴀ')+s.FOOTER);}
catch{await ctx.reply('❌ ᴜɴᴀᴠᴀɪʟᴀʙʟᴇ.'+s.FOOTER);}}};

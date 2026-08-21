'use strict';
const axios=require('axios');
module.exports={name:'trsimple',aliases:['quicktranslate','fasttrans'],category:'language',desc:'ǫᴜɪᴄᴋ ᴛʀᴀɴsʟᴀᴛᴇ ᴛᴏ ᴇɴɢʟɪsʜ',usage:'†trsimple <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'trsimple Bonjour'+s.FOOTER);
try{const r=await require('axios').get('https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q='+encodeURIComponent(q));
const out=r.data?.[0]?.map(x=>x?.[0]).filter(Boolean).join('');
await ctx.reply('🌐 *ᴇɴɢʟɪsʜ:* '+out+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

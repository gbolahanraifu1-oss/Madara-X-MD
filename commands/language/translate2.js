'use strict';
const axios=require('axios');
module.exports={name:'translate2',aliases:['tr2','gtranslate'],category:'language',desc:'ɢᴏᴏɢʟᴇ ᴛʀᴀɴsʟᴀᴛᴇ',usage:'†translate2 <lang> <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const lang=args[0]||'en',text=args.slice(1).join(' ');
if(!text)return ctx.reply('❌ '+s.prefix+'translate2 fr Hello'+s.FOOTER);
try{const r=await require('axios').get('https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl='+lang+'&dt=t&q='+encodeURIComponent(text));
const out=r.data?.[0]?.map(x=>x?.[0]).filter(Boolean).join('');
await ctx.reply('🌐 *['+lang+']* '+out+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

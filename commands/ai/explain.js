'use strict';
const axios=require('axios');
module.exports={name:'explain',aliases:['simplify','layman'],category:'ai',desc:'ᴇxᴘʟᴀɪɴ ʟɪᴋᴇ ɪ ᴀᴍ 5',usage:'†explain <topic>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'explain quantum physics'+s.FOOTER);
await ctx.react('⏳');
try{const r=await require('axios').get('https://api.dreaded.site/api/gpt?text=Explain+this+simply+like+I+am+5+years+old:+'+encodeURIComponent(q));
await ctx.reply('💡 *sɪᴍᴘʟᴇ ᴇxᴘʟᴀɴᴀᴛɪᴏɴ*\n\n'+(r.data?.result||r.data?.message||'ɴᴏ ʀᴇsᴘᴏɴsᴇ.')+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

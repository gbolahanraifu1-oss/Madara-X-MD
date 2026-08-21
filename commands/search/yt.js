'use strict';
const axios=require('axios');
module.exports={name:'yt',aliases:['ytsearch','youtubesearch'],category:'search',desc:'sᴇᴀʀᴄʜ ʏᴏᴜᴛᴜʙᴇ',usage:'†yt <query>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'yt Naruto OST'+s.FOOTER);
try{const yts=require('yt-search');const r=await yts(q);const vids=r.videos.slice(0,3);
const lines=vids.map((v,i)=>(i+1)+'. *'+v.title+'*\n⏱️ '+v.timestamp+' | 👀 '+v.views?.toLocaleString()+'\n🔗 '+v.url).join('\n\n');
await ctx.reply('🔍 *ʏᴏᴜᴛᴜʙᴇ: '+q+'*\n\n'+lines+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

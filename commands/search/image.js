'use strict';
const axios=require('axios');
module.exports={name:'image',aliases:['imgsearch','searchimage'],category:'search',desc:'sᴇᴀʀᴄʜ ɪᴍᴀɢᴇs',usage:'†image <query>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'image anime wallpaper'+s.FOOTER);
try{const r=await require('axios').get('https://api.dreaded.site/api/bing/images?query='+encodeURIComponent(q));
const imgs=r.data?.result?.slice(0,4);if(!imgs?.length)throw new Error('ɴᴏ ɪᴍᴀɢᴇs');
for(const img of imgs)await sock.sendMessage(ctx.from,{image:{url:img.url||img},caption:'🖼️ '+q+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

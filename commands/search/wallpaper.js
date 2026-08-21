'use strict';
const axios=require('axios');
module.exports={name:'wallpaper',aliases:['wallhaven','wallpaper2'],category:'search',desc:'ɢᴇᴛ ʜᴅ ᴡᴀʟʟᴘᴀᴘᴇʀ',usage:'†wallpaper <query>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ')||'anime';
try{const r=await require('axios').get('https://wallhaven.cc/api/v1/search?q='+encodeURIComponent(q)+'&purity=100&categories=111&sorting=random&page=1');
const w2=r.data?.data?.slice(0,3);if(!w2?.length)throw new Error('ɴᴏ ʀᴇsᴜʟᴛs');
for(const wp of w2)await sock.sendMessage(ctx.from,{image:{url:wp.thumbs?.large||wp.path},caption:'🖼️ '+q+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

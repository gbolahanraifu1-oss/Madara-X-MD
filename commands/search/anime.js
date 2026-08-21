'use strict';
const axios=require('axios');
module.exports={name:'anime',aliases:['animesearch','findanime'],category:'search',desc:'sᴇᴀʀᴄʜ ᴀɴɪᴍᴇ ɪɴғᴏ',usage:'†anime <title>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'anime naruto'+s.FOOTER);
try{const r=await require('axios').get('https://api.jikan.moe/v4/anime?q='+encodeURIComponent(q)+'&limit=1');
const a=r.data?.data?.[0];if(!a)throw new Error('ɴᴏᴛ ғᴏᴜɴᴅ');
await sock.sendMessage(ctx.from,{image:{url:a.images.jpg.large_image_url},
caption:'🎌 *'+a.title+'*\n\n⭐ sᴄᴏʀᴇ: '+a.score+'\n📅 ʏᴇᴀʀ: '+a.year+'\n📺 ᴇᴘɪsᴏᴅᴇs: '+a.episodes+'\n🎭 ɢᴇɴʀᴇ: '+a.genres?.map(g=>g.name).join(', ')+'\n\n'+a.synopsis?.slice(0,300)+'...'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ ᴀɴɪᴍᴇ ɴᴏᴛ ғᴏᴜɴᴅ.'+s.FOOTER);}}};

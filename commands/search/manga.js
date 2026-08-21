'use strict';
const axios=require('axios');
module.exports={name:'manga',aliases:['mangasearch','findmanga'],category:'search',desc:'sᴇᴀʀᴄʜ ᴍᴀɴɢᴀ',usage:'†manga <title>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'manga one piece'+s.FOOTER);
try{const r=await require('axios').get('https://api.jikan.moe/v4/manga?q='+encodeURIComponent(q)+'&limit=1');
const a=r.data?.data?.[0];if(!a)throw new Error();
await sock.sendMessage(ctx.from,{image:{url:a.images.jpg.large_image_url},
caption:'📚 *'+a.title+'*\n\n⭐ sᴄᴏʀᴇ: '+a.score+'\n📖 ᴄʜᴀᴘᴛᴇʀs: '+a.chapters+'\n🎭 ɢᴇɴʀᴇ: '+a.genres?.map(g=>g.name).join(', ')+'\n\n'+a.synopsis?.slice(0,300)+'...'+s.FOOTER},{quoted:msg});}
catch{await ctx.reply('❌ ɴᴏᴛ ғᴏᴜɴᴅ.'+s.FOOTER);}}};

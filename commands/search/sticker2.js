'use strict';
const axios=require('axios');
module.exports={name:'sticker2',aliases:['stickerpack','tgpack'],category:'search',desc:'sᴇᴀʀᴄʜ sᴛɪᴄᴋᴇʀ ᴘᴀᴄᴋs',usage:'†sticker2 <query>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ')||'anime';
try{const r=await require('axios').get('https://api.dreaded.site/api/sticker?query='+encodeURIComponent(q));
const packs=r.data?.result?.slice(0,5);if(!packs?.length)throw new Error('ɴᴏᴛ ғᴏᴜɴᴅ');
await ctx.reply('🎨 *sᴛɪᴄᴋᴇʀ ᴘᴀᴄᴋs ғᴏʀ "'+q+'":*\n\n'+packs.map((p,i)=>(i+1)+'. '+p.name+'\n🔗 '+p.link).join('\n\n')+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

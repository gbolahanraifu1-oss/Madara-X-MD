'use strict';
const axios=require('axios');
module.exports={name:'lyrics2',aliases:['songfind','findlyrics'],category:'utility',desc:'sᴇᴀʀᴄʜ ʟʏʀɪᴄs ʙʏ sɴɪᴘᴘᴇᴛ',usage:'†lyrics2 <snippet>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'lyrics2 never gonna give you up'+s.FOOTER);
try{const r=await require('axios').get('https://lyrist.vercel.app/api/'+encodeURIComponent(q));
if(!r.data?.lyrics)throw new Error('ɴᴏᴛ ғᴏᴜɴᴅ');
await ctx.reply('🎵 *'+r.data.title+'*\n👤 '+r.data.artist+'\n\n'+r.data.lyrics.slice(0,2000)+s.FOOTER);}
catch(e){await ctx.reply('❌ ʟʏʀɪᴄs ɴᴏᴛ ғᴏᴜɴᴅ.'+s.FOOTER);}}};

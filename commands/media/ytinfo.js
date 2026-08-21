'use strict';
module.exports={name:'ytinfo',aliases:['videoinfo','ytdetail'],category:'media',desc:'ɢᴇᴛ ʏᴏᴜᴛᴜʙᴇ ᴠɪᴅᴇᴏ ɪɴғᴏ',usage:'†ytinfo <url or title>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'ytinfo Naruto opening'+s.FOOTER);
await ctx.react('⏳');
try{const yts=require('yt-search');const r=await yts(q);const v=r.videos[0];if(!v)throw new Error('ɴᴏᴛ ғᴏᴜɴᴅ');
await sock.sendMessage(ctx.from,{image:{url:v.thumbnail},caption:'📹 *'+v.title+'*\n\n👤 ᴄʜᴀɴɴᴇʟ: '+v.author.name+'\n⏱️ ᴅᴜʀ: '+v.timestamp+'\n👀 ᴠɪᴇᴡs: '+v.views?.toLocaleString()+'\n📅 '+v.ago+'\n🔗 '+v.url+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

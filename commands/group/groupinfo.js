'use strict';
module.exports={name:'groupinfo',aliases:['ginfo','gcinfo'],category:'group',desc:'ɢᴇᴛ ɢʀᴏᴜᴘ ɪɴғᴏ',usage:'†groupinfo',groupOnly:true,adminOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
const meta=await sock.groupMetadata(ctx.from).catch(()=>null);
if(!meta)return ctx.reply('❌ ɴᴏᴛ ᴀ ɢʀᴏᴜᴘ.'+s.FOOTER);
const admins=meta.participants.filter(p=>p.admin).length;
await ctx.reply('👥 *'+meta.subject+'*\n\n📋 ᴅᴇsᴄ: '+(meta.desc||'ɴ/ᴀ').slice(0,100)+'\n👤 ᴍᴇᴍʙᴇʀs: *'+meta.participants.length+'*\n👮 ᴀᴅᴍɪɴs: *'+admins+'*\n🆔 ɪᴅ: '+ctx.from.split('@')[0]+s.FOOTER);}};

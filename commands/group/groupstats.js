'use strict';
module.exports={name:'groupstats',aliases:['gstats','groupstat'],category:'group',desc:'sʜᴏᴡ ɢʀᴏᴜᴘ sᴛᴀᴛɪsᴛɪᴄs',usage:'†groupstats',groupOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
try{const meta=await sock.groupMetadata(ctx.from);
const admins=meta.participants.filter(p=>p.admin).length;
const regular=meta.participants.length-admins;
await ctx.reply('📊 *ɢʀᴏᴜᴘ sᴛᴀᴛs*\n\n👥 ᴛᴏᴛᴀʟ: *'+meta.participants.length+'*\n👮 ᴀᴅᴍɪɴs: *'+admins+'*\n👤 ᴍᴇᴍʙᴇʀs: *'+regular+'*\n📅 ᴄʀᴇᴀᴛᴇᴅ: *'+new Date(meta.creation*1000).toLocaleDateString()+'*'+s.FOOTER);}catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

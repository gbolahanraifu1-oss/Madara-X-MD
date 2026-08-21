'use strict';
module.exports={name:'leave',aliases:['leavegroup','exitgroup'],category:'owner',desc:'ʟᴇᴀᴠᴇ ᴀ ɢʀᴏᴜᴘ',usage:'†leave',ownerOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isOwner)return ctx.reply('⛔ ᴏᴡɴᴇʀ ᴏɴʟʏ.'+s.FOOTER);
if(!ctx.isGroup)return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ.'+s.FOOTER);
await ctx.reply('👋 ɢᴏᴏᴅʙʏᴇ!'+s.FOOTER);
setTimeout(()=>sock.groupLeave(ctx.from),1500);}};

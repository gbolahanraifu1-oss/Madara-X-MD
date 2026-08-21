'use strict';
module.exports={name:'memboost',aliases:['clearglobal','memclear'],category:'owner',desc:'ᴄʟᴇᴀʀ ɢʟᴏʙᴀʟ ᴄᴀᴄʜᴇ',usage:'†memboost',ownerOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isDevOwner)return ctx.reply('⛔ *ᴅᴇᴠ ᴏɴʟʏ.*'+s.FOOTER);
const before=process.memoryUsage().heapUsed;
if(global.gc)global.gc();
const after=process.memoryUsage().heapUsed;
await ctx.reply('🧹 *ᴍᴇᴍᴏʀʏ ᴄʟᴇᴀɴᴇᴅ*\n\n⬇️ ʀᴇᴅᴜᴄᴇᴅ: *'+Math.round((before-after)/1024)+'ᴋʙ*'+s.FOOTER);}};

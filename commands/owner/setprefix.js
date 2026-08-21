'use strict';
module.exports={name:'setprefix',aliases:['prefix','changeprefix'],category:'owner',desc:'ᴄʜᴀɴɢᴇ ʙᴏᴛ ᴘʀᴇғɪx',usage:'†setprefix <prefix>',ownerOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isDevOwner)return ctx.reply('⛔ *ᴅᴇᴠ ᴏɴʟʏ.*'+s.FOOTER);
const p=args[0];if(!p)return ctx.reply('❌ '+s.prefix+'setprefix .'+s.FOOTER);
process.env.PREFIX=p;s.prefix=p;
await ctx.reply('✅ ᴘʀᴇғɪx sᴇᴛ ᴛᴏ *'+p+'*'+s.FOOTER);}};

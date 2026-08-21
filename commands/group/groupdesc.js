'use strict';
module.exports={name:'groupdesc',aliases:['desc','setdesc2'],category:'group',desc:'sᴇᴛ ɢʀᴏᴜᴘ ᴅᴇsᴄʀɪᴘᴛɪᴏɴ',usage:'†groupdesc <text>',groupOnly:true,adminOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
const desc=args.join(' ');if(!desc)return ctx.reply('❌ '+s.prefix+'groupdesc Your description'+s.FOOTER);
await sock.groupUpdateDescription(ctx.from,desc);
await ctx.reply('✅ ɢʀᴏᴜᴘ ᴅᴇsᴄʀɪᴘᴛɪᴏɴ ᴜᴘᴅᴀᴛᴇᴅ.'+s.FOOTER);}};

'use strict';
module.exports={name:'autoreact',aliases:['ar','reactauto'],category:'system',desc:'ᴛᴏɢɢʟᴇ ᴀᴜᴛᴏ ʀᴇᴀᴄᴛ',usage:'†autoreact on/off',
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isOwner)return ctx.reply('⛔ ᴏᴡɴᴇʀ ᴏɴʟʏ.'+s.FOOTER);
const val=args[0]?.toLowerCase()==='on';
global._autoReact=val;
await ctx.reply((val?'✅':'❌')+' ᴀᴜᴛᴏ-ʀᴇᴀᴄᴛ: *'+(val?'ON':'OFF')+'*'+s.FOOTER);}};

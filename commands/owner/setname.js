'use strict';
module.exports={name:'setname',aliases:['botname','rename2'],category:'owner',desc:'sᴇᴛ ʙᴏᴛ ɴᴀᴍᴇ',usage:'†setname <name>',ownerOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isDevOwner)return ctx.reply('⛔ *ᴅᴇᴠ ᴏɴʟʏ.*'+s.FOOTER);
const name=args.join(' ');if(!name)return ctx.reply('❌ ᴇɴᴛᴇʀ ɴᴀᴍᴇ.'+s.FOOTER);
s.botName=name;
await ctx.reply('✅ ʙᴏᴛ ɴᴀᴍᴇ: *'+name+'*'+s.FOOTER);}};

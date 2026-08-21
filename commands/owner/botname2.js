'use strict';
module.exports={name:'botname2',aliases:['setbotname','changebotname'],category:'owner',desc:'sᴇᴛ ʙᴏᴛ ᴡʜᴀᴛsᴀᴘᴘ ɴᴀᴍᴇ',usage:'†botname2 <name>',ownerOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isOwner)return ctx.reply('⛔ ᴏᴡɴᴇʀ ᴏɴʟʏ.'+s.FOOTER);
const name=args.join(' ');if(!name)return ctx.reply('❌ ᴘʀᴏᴠɪᴅᴇ ᴀ ɴᴀᴍᴇ.'+s.FOOTER);
await sock.updateProfileName(name);
await ctx.reply('✅ ɴᴀᴍᴇ sᴇᴛ ᴛᴏ *'+name+'*'+s.FOOTER);}};

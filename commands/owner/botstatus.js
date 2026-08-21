'use strict';
module.exports={name:'botstatus',aliases:['setstatus','statusbot'],category:'owner',desc:'sᴇᴛ ʙᴏᴛ ᴡʜᴀᴛsᴀᴘᴘ sᴛᴀᴛᴜs',usage:'†botstatus <text>',ownerOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isOwner)return ctx.reply('⛔ ᴏᴡɴᴇʀ ᴏɴʟʏ.'+s.FOOTER);
const status=args.join(' ')||'🤖 ᴍᴀᴅᴀʀᴀ x-ᴍᴅ | ᴏɴʟɪɴᴇ';
await sock.updateProfileStatus(status);
await ctx.reply('✅ sᴛᴀᴛᴜs ᴜᴘᴅᴀᴛᴇᴅ!'+s.FOOTER);}};

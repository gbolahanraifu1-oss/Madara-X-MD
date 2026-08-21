'use strict';
module.exports={name:'unmute2',aliases:['opengroup','unlockgroup'],category:'group',desc:'ᴜɴᴍᴜᴛᴇ ɢʀᴏᴜᴘ',usage:'†unmute2',groupOnly:true,adminOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isBotAdmin)return ctx.reply('❌ ɪ ɴᴇᴇᴅ ᴀᴅᴍɪɴ.'+s.FOOTER);
await sock.groupSettingUpdate(ctx.from,'not_announcement');
await ctx.reply('🔊 ɢʀᴏᴜᴘ ᴜɴᴍᴜᴛᴇᴅ — ᴇᴠᴇʀʏᴏɴᴇ ᴄᴀɴ sᴇɴᴅ.'+s.FOOTER);}};

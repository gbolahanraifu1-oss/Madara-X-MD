'use strict';
module.exports={name:'mute2',aliases:['closegroup','lockgroup'],category:'group',desc:'ᴍᴜᴛᴇ ɢʀᴏᴜᴘ (ᴀᴅᴍɪɴ ᴏɴʟʏ ᴍsɢ)',usage:'†mute2',groupOnly:true,adminOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isBotAdmin)return ctx.reply('❌ ɪ ɴᴇᴇᴅ ᴀᴅᴍɪɴ.'+s.FOOTER);
await sock.groupSettingUpdate(ctx.from,'announcement');
await ctx.reply('🔇 ɢʀᴏᴜᴘ ᴍᴜᴛᴇᴅ — ᴏɴʟʏ ᴀᴅᴍɪɴs ᴄᴀɴ sᴇɴᴅ.'+s.FOOTER);}};

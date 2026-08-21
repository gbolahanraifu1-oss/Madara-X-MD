'use strict';
module.exports={name:'goodmorning',aliases:['gm','morningwish'],category:'fun',desc:'sᴇɴᴅ ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ',usage:'†goodmorning',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const msgs=['☀️ ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ! ᴍᴀʏ ᴛʜɪs ᴅᴀʏ ʙʀɪɴɢ ʏᴏᴜ ᴊᴏʏ!','🌅 ʀɪsᴇ ᴀɴᴅ sʜɪɴᴇ! ᴛᴏᴅᴀʏ ɪs ʏᴏᴜʀ ᴅᴀʏ!','⭐ ᴀ ɴᴇᴡ ᴅᴀʏ, ᴀ ɴᴇᴡ ʙᴇɢɪɴɴɪɴɢ!'];
await ctx.reply(msgs[Math.floor(Math.random()*msgs.length)]+'\n\n_— ᴍᴀᴅᴀʀᴀ x-ᴍᴅ_'+s.FOOTER);}};

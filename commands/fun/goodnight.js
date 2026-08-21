'use strict';
module.exports={name:'goodnight',aliases:['gn','nightwish'],category:'fun',desc:'sᴇɴᴅ ɢᴏᴏᴅ ɴɪɢʜᴛ',usage:'†goodnight',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const msgs=['🌙 ɢᴏᴏᴅ ɴɪɢʜᴛ! sᴡᴇᴇᴛ ᴅʀᴇᴀᴍs!','💤 ʀᴇsᴛ ᴡᴇʟʟ ᴀɴᴅ ᴡᴀᴋᴇ ᴜᴘ ʙᴇᴀᴜᴛɪғᴜʟ!','⭐ ᴛʜᴇ sᴛᴀʀs ᴀʀᴇ ᴡᴀᴛᴄʜɪɴɢ ᴏᴠᴇʀ ʏᴏᴜ!'];
await ctx.reply(msgs[Math.floor(Math.random()*msgs.length)]+'\n\n_— ᴍᴀᴅᴀʀᴀ x-ᴍᴅ_'+s.FOOTER);}};

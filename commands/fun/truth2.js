'use strict';
module.exports={name:'truth2',aliases:['hardtruth','deeptruth'],category:'fun',desc:'ʜᴀʀᴅ ᴛʀᴜᴛʜ',usage:'†truth2',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const T=['ᴡʜᴀᴛ ɪs ᴛʜᴇ ᴍᴏsᴛ ᴇᴍʙᴀʀʀᴀssɪɴɢ ᴛʜɪɴɢ ʏᴏᴜ ʜᴀᴠᴇ ᴇᴠᴇʀ ᴅᴏɴᴇ?','ᴡʜᴏ ᴅᴏ ʏᴏᴜ ʜᴀᴠᴇ ᴀ sᴇᴄʀᴇᴛ ᴄʀᴜsʜ ᴏɴ?','ʜᴀᴠᴇ ʏᴏᴜ ᴇᴠᴇʀ ʟɪᴇᴅ ᴛᴏ sᴏᴍᴇᴏɴᴇ ʏᴏᴜ ʟᴏᴠᴇ?','ᴡʜᴀᴛ ɪs ʏᴏᴜʀ ʙɪɢɢᴇsᴛ ʀᴇɢʀᴇᴛ?','ᴡʜᴀᴛ ɪs sᴏᴍᴇᴛʜɪɴɢ ʏᴏᴜ ʜᴀᴠᴇ ɴᴇᴠᴇʀ ᴛᴏʟᴅ ᴀɴʏᴏɴᴇ?'];
await ctx.reply('🔥 *ʜᴀʀᴅ ᴛʀᴜᴛʜ*\n\n'+T[Math.floor(Math.random()*T.length)]+s.FOOTER);}};

'use strict';
module.exports={name:'rizz',aliases:['pickup2','charming'],category:'fun',desc:'ɢᴇᴛ ᴀ ʀɪᴢᴢ ʟɪɴᴇ',usage:'†rizz',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const R=['ᴀʀᴇ ʏᴏᴜ ᴡɪ-ғɪ? ʙᴇᴄᴀᴜsᴇ ɪ ғᴇᴇʟ ᴀ ᴄᴏɴɴᴇᴄᴛɪᴏɴ.','ᴅᴏ ʏᴏᴜ ʜᴀᴠᴇ ᴀ ɴᴀᴍᴇ ᴏʀ ᴄᴀɴ ɪ ᴄᴀʟʟ ʏᴏᴜ ᴍɪɴᴇ?','ᴀʀᴇ ʏᴏᴜ ᴀ ᴍᴀɢɪᴄɪᴀɴ? ᴡʜᴇɴ ɪ ʟᴏᴏᴋ ᴀᴛ ʏᴏᴜ ᴇᴠᴇʀʏᴏɴᴇ ᴇʟsᴇ ᴅɪsᴀᴘᴘᴇᴀʀs.','ɪ ᴍᴜsᴛ ʙᴇ ᴀ sɴᴏᴡғʟᴀᴋᴇ ʙᴇᴄᴀᴜsᴇ ɪ ᴀᴍ ᴀ ғᴀʟʟɪɴɢ ғᴏʀ ʏᴏᴜ.'];
await ctx.reply('😏 *ʀɪᴢᴢ ʟɪɴᴇ*\n\n'+R[Math.floor(Math.random()*R.length)]+s.FOOTER);}};

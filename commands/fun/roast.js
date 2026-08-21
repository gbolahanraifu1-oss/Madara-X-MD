'use strict';
const R=['ɪ\'ᴅ ʀᴏᴀsᴛ ʏᴏᴜ ʙᴜᴛ ᴍʏ ᴍᴏᴍ sᴀɪᴅ ɪ\'ᴍ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ ᴛᴏ ʙᴜʀɴ ᴛʀᴀsʜ.','ʏᴏᴜ\'ʀᴇ ᴛʜᴇ ʀᴇᴀsᴏɴ sʜᴀᴍᴘᴏᴏ ʜᴀs ɪɴsᴛʀᴜᴄᴛɪᴏɴs.','ɪ\'ᴅ ᴇxᴘʟᴀɪɴ ɪᴛ ᴛᴏ ʏᴏᴜ ʙᴜᴛ ɪ ʟᴇғᴛ ᴍʏ ᴄʀᴀʏᴏɴs ᴀᴛ ʜᴏᴍᴇ.','ʏᴏᴜ\'ʀᴇ ᴡʜᴀᴛ ʜᴀᴘᴘᴇɴs ᴡʜᴇɴ ᴡɪ-ғɪ ɪs ᴛᴏᴏ sʟᴏᴡ ᴛᴏ ᴅᴏᴡɴʟᴏᴀᴅ ᴀ ᴘᴇʀsᴏɴᴀʟɪᴛʏ.'];
module.exports={name:'roast',aliases:['roastme','burn'],category:'fun',desc:'ɢᴇᴛ ʀᴏᴀsᴛᴇᴅ 🔥',usage:'†roast',
async execute(sock,msg,args,ctx){const s=ctx.settings;await ctx.reply(`🔥 *ʀᴏᴀsᴛ*\n\n${R[Math.floor(Math.random()*R.length)]}${s.FOOTER}`);}};

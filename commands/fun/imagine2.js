'use strict';
module.exports={name:'imagine2',aliases:['whatif','scenario'],category:'fun',desc:'ɪᴍᴀɢɪɴᴇ sᴄᴇɴᴀʀɪᴏ',usage:'†imagine2',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const S=['ɪᴍᴀɢɪɴᴇ ɪғ ᴡᴇ ᴄᴏᴜʟᴅ ᴄʜᴀᴛ ɪɴ ᴘᴇʀsᴏɴ...','ɪᴍᴀɢɪɴᴇ ɪғ ᴛʜɪs ɢʀᴏᴜᴘ ᴡᴇɴᴛ ᴏɴ ᴀ ᴛʀɪᴘ ᴛᴏɢᴇᴛʜᴇʀ...','ɪᴍᴀɢɪɴᴇ ɪғ ᴍᴏɴᴇʏ ᴅɪᴅɴ\'ᴛ ᴇxɪsᴛ...','ɪᴍᴀɢɪɴᴇ ɪғ ʏᴏᴜ ᴡᴏᴋᴇ ᴜᴘ ᴀs ᴀ ᴅɪғғᴇʀᴇɴᴛ ɢᴇɴᴅᴇʀ...'];
await ctx.reply('💭 *ɪᴍᴀɢɪɴᴇ...*\n\n'+S[Math.floor(Math.random()*S.length)]+s.FOOTER);}};

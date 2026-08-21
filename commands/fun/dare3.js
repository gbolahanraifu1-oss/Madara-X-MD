'use strict';
module.exports={name:'dare3',aliases:['groupdare','gdare'],category:'fun',desc:'ɢʀᴏᴜᴘ ᴅᴀʀᴇ ᴄʜᴀʟʟᴇɴɢᴇ',usage:'†dare3',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const D=['ᴇᴠᴇʀʏᴏɴᴇ ᴄʜᴀɴɢᴇ ᴛʜᴇɪʀ ᴅᴘ ᴛᴏ ᴀ ᴍᴇᴍᴇ ғᴏʀ 1ʜ','sᴇɴᴅ ᴀ ᴠᴏɪᴄᴇ ɴᴏᴛᴇ sɪɴɢɪɴɢ ʏᴏᴜʀ ɴᴀᴍᴇ','ᴛʏᴘᴇ ᴏɴʟʏ ᴜsɪɴɢ ᴇᴍᴏᴊɪs ғᴏʀ ᴛʜᴇ ɴᴇxᴛ 5 ᴍɪɴs','sᴇɴᴅ ʏᴏᴜʀ ᴄᴜʀʀᴇɴᴛ ʙᴀᴛᴛᴇʀʏ %'];
await ctx.reply('😈 *ɢʀᴏᴜᴘ ᴅᴀʀᴇ*\n\n'+D[Math.floor(Math.random()*D.length)]+s.FOOTER);}};

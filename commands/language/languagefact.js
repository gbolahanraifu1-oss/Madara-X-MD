'use strict';
const axios=require('axios');
module.exports={name:'languagefact',aliases:['langfact','linguist'],category:'language',desc:'ɢᴇᴛ ᴀ ʟᴀɴɢᴜᴀɢᴇ ғᴀᴄᴛ',usage:'†languagefact',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const FACTS=['ᴛʜᴇʀᴇ ᴀʀᴇ ᴏᴠᴇʀ 7,000 ʟᴀɴɢᴜᴀɢᴇs sᴘᴏᴋᴇɴ ɪɴ ᴛʜᴇ ᴡᴏʀʟᴅ.','ᴍᴀɴᴅᴀʀɪɴ ᴄʜɪɴᴇsᴇ ɪs ᴛʜᴇ ᴍᴏsᴛ sᴘᴏᴋᴇɴ ʟᴀɴɢᴜᴀɢᴇ.','ᴘᴀᴘᴜᴀ ɴᴇᴡ ɢᴜɪɴᴇᴀ ʜᴀs ᴏᴠᴇʀ 800 ʟᴀɴɢᴜᴀɢᴇs.','ᴀʀᴀʙɪᴄ ɪs ᴡʀɪᴛᴛᴇɴ ʀɪɢʜᴛ ᴛᴏ ʟᴇғᴛ.','ʏᴏʀᴜʙᴀ ɪs ᴛᴏɴᴀʟ — sᴀᴍᴇ ᴡᴏʀᴅ, ᴅɪғғᴇʀᴇɴᴛ ᴛᴏɴᴇ, ᴅɪғғᴇʀᴇɴᴛ ᴍᴇᴀɴɪɴɢ.'];
await ctx.reply('📖 *ʟᴀɴɢᴜᴀɢᴇ ғᴀᴄᴛ*\n\n'+FACTS[Math.floor(Math.random()*FACTS.length)]+s.FOOTER);}};

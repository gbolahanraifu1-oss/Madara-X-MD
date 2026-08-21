'use strict';
module.exports={name:'thisordat',aliases:['thatordat','choosegame'],category:'fun',desc:'ᴛʜɪs ᴏʀ ᴛʜᴀᴛ',usage:'†thisordat',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const T=[['ᴛᴇᴀ','ᴄᴏғғᴇᴇ'],['ᴅᴀʏ','ɴɪɢʜᴛ'],['ᴄᴀᴛ','ᴅᴏɢ'],['ᴘɪᴢᴢᴀ','ʙᴜʀɢᴇʀ'],['ɴᴇᴛғʟɪx','ʏᴏᴜᴛᴜʙᴇ'],['ᴡʜᴀᴛsᴀᴘᴘ','ᴛᴇʟᴇɢʀᴀᴍ']];
const q=T[Math.floor(Math.random()*T.length)];
await ctx.reply('🤔 *ᴛʜɪs ᴏʀ ᴛʜᴀᴛ*\n\n🔵 '+q[0]+'\n\n🔴 '+q[1]+s.FOOTER);}};

'use strict';
module.exports={name:'would',aliases:['wouldyou','wys'],category:'fun',desc:'ᴡᴏᴜʟᴅ ʏᴏᴜ ʀᴀᴛʜᴇʀ v2',usage:'†would',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const W=[['ʙᴇ ʀɪᴄʜ ᴀɴᴅ ᴜɴʜᴀᴘᴘʏ','ᴘᴏᴏʀ ᴀɴᴅ ʜᴀᴘᴘʏ'],['ʜᴀᴠᴇ sᴜᴘᴇʀ sᴘᴇᴇᴅ','ʙᴇ ɪɴᴠɪsɪʙʟᴇ'],['ɴᴇᴠᴇʀ ᴜsᴇ sᴏᴄɪᴀʟ ᴍᴇᴅɪᴀ ᴀɢᴀɪɴ','ɴᴇᴠᴇʀ ᴡᴀᴛᴄʜ ᴀɴɪᴍᴇ ᴀɢᴀɪɴ'],['ʙᴇ ᴀʙʟᴇ ᴛᴏ ᴛɪᴍᴇ ᴛʀᴀᴠᴇʟ','ʀᴇᴀᴅ ᴍɪɴᴅs']];
const q=W[Math.floor(Math.random()*W.length)];
await ctx.reply('🤔 *ᴡᴏᴜʟᴅ ʏᴏᴜ ʀᴀᴛʜᴇʀ?*\n\n🅰️ '+q[0]+'\n\n🅱️ '+q[1]+s.FOOTER);}};

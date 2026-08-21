'use strict';
const axios=require('axios');
const FALLBACK=['ᴡʜʏ ᴅᴏɴ\'ᴛ sᴄɪᴇɴᴛɪsᴛs ᴛʀᴜsᴛ ᴀᴛᴏᴍs? ʙᴇᴄᴀᴜsᴇ ᴛʜᴇʏ ᴍᴀᴋᴇ ᴜᴘ ᴇᴠᴇʀʏᴛʜɪɴɢ!','ᴡʜʏ ᴄᴀɴ\'ᴛ ᴇʟᴏɴ ᴍᴜsᴋ ᴛᴡᴇᴇᴛ ɪɴ 280 ᴄʜᴀʀᴀᴄᴛᴇʀs? ʜᴇ ᴄᴀɴ\'ᴛ ᴇᴠᴇɴ ʀᴜɴ ᴀ ᴄᴏᴍᴘᴀɴʏ ɪɴ 140.','ɪ ᴛᴏʟᴅ ᴍʏ ᴡɪғᴇ sʜᴇ ᴡᴀs ᴅʀᴀᴡɪɴɢ ʜᴇʀ ᴇʏᴇʙʀᴏᴡs ᴛᴏᴏ ʜɪɢʜ. sʜᴇ ʟᴏᴏᴋᴇᴅ sᴜʀᴘʀɪsᴇᴅ.'];
module.exports={name:'joke',aliases:['jokes','jk'],category:'fun',desc:'ɢᴇᴛ ᴀ ʀᴀɴᴅᴏᴍ ᴊᴏᴋᴇ',usage:'†joke',
async execute(sock,msg,args,ctx){const s=ctx.settings;
try{const r=await axios.get('https://v2.jokeapi.dev/joke/Any?blacklistFlags=racist,sexist&type=single');
const j=r.data?.joke||FALLBACK[Math.floor(Math.random()*FALLBACK.length)];
await ctx.reply(`😂 *ᴊᴏᴋᴇ*\n\n${j}${s.FOOTER}`);}
catch{await ctx.reply(`😂 *ᴊᴏᴋᴇ*\n\n${FALLBACK[Math.floor(Math.random()*FALLBACK.length)]}${s.FOOTER}`);}
}};

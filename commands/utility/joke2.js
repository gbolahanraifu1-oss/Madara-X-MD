'use strict';
const axios=require('axios');
module.exports={name:'joke2',aliases:['darkjoke','dadjoke'],category:'utility',desc:'ɢᴇᴛ ᴀ ᴅᴀᴅ ᴊᴏᴋᴇ',usage:'†joke2',
async execute(sock,msg,args,ctx){const s=ctx.settings;
try{const r=await require('axios').get('https://icanhazdadjoke.com/',{headers:{Accept:'application/json'}});
await ctx.reply('😄 *ᴅᴀᴅ ᴊᴏᴋᴇ*\n\n'+r.data.joke+s.FOOTER);}
catch{await ctx.reply('😄 ᴡʜʏ ᴅɪᴅ ᴛʜᴇ sᴄᴀʀᴇᴄʀᴏᴡ ᴡɪɴ ᴀɴ ᴀᴡᴀʀᴅ? ʙᴇᴄᴀᴜsᴇ ʜᴇ ᴡᴀs ᴏᴜᴛsᴛᴀɴᴅɪɴɢ ɪɴ ʜɪs ғɪᴇʟᴅ!'+s.FOOTER);}}};

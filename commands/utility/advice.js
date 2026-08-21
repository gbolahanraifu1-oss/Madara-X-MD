'use strict';
const axios=require('axios');
module.exports={name:'advice',aliases:['tip','counsel'],category:'utility',desc:'ɢᴇᴛ ᴀ ʀᴀɴᴅᴏᴍ ᴀᴅᴠɪᴄᴇ',usage:'†advice',
async execute(sock,msg,args,ctx){const s=ctx.settings;
try{const r=await require('axios').get('https://api.adviceslip.com/advice');
await ctx.reply('💡 *ᴀᴅᴠɪᴄᴇ*\n\n'+r.data.slip.advice+s.FOOTER);}
catch{await ctx.reply('💡 ᴡᴏʀᴋ sᴍᴀʀᴛ ɴᴏᴛ ʜᴀʀᴅ, ʙᴜᴛ ᴡᴏʀᴋ ʜᴀʀᴅ ᴛᴏᴏ.'+s.FOOTER);}}};

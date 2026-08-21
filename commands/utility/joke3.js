'use strict';
const axios=require('axios');
module.exports={name:'joke3',aliases:['chucknorris','chuck'],category:'utility',desc:'ᴄʜᴜᴄᴋ ɴᴏʀʀɪs ᴊᴏᴋᴇ',usage:'†joke3',
async execute(sock,msg,args,ctx){const s=ctx.settings;
try{const r=await require('axios').get('https://api.chucknorris.io/jokes/random');
await ctx.reply('💪 *ᴄʜᴜᴄᴋ ɴᴏʀʀɪs*\n\n'+r.data.value+s.FOOTER);}
catch{await ctx.reply('❌ ᴄᴏᴜʟᴅɴ\'ᴛ ғᴇᴛᴄʜ.'+s.FOOTER);}}};

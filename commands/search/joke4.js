'use strict';
const axios=require('axios');
module.exports={name:'joke4',aliases:['programmerjoke','devjoke'],category:'search',desc:'ᴘʀᴏɢʀᴀᴍᴍᴇʀ ᴊᴏᴋᴇ',usage:'†joke4',
async execute(sock,msg,args,ctx){const s=ctx.settings;
try{const r=await require('axios').get('https://v2.jokeapi.dev/joke/Programming');
const j=r.data;const text=j.type==='twopart'?j.setup+'\n\n'+j.delivery:j.joke;
await ctx.reply('💻 *ᴘʀᴏɢ ᴊᴏᴋᴇ*\n\n'+text+s.FOOTER);}
catch{await ctx.reply('❌ ғᴀɪʟᴇᴅ.'+s.FOOTER);}}};

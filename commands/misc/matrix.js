'use strict';
const axios=require('axios');
module.exports={name:'matrix',aliases:['matrixrain','greencode'],category:'misc',desc:'ᴍᴀᴛʀɪx ᴄᴏᴅᴇ ᴇғғᴇᴄᴛ',usage:'†matrix',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const chars='ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾂﾀﾇﾍ012345789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lines=Array.from({length:8},()=>Array.from({length:20},()=>chars[Math.floor(Math.random()*chars.length)]).join('')).join('\n');
await ctx.reply('```\n'+lines+'\n```\n_ᴡᴀᴋᴇ ᴜᴘ, ɴᴇᴏ..._'+s.FOOTER);}};

'use strict';
const axios=require('axios');
module.exports={name:'randomcolor',aliases:['rcolor','colorgen'],category:'utility',desc:'ɢᴇɴᴇʀᴀᴛᴇ ʀᴀɴᴅᴏᴍ ᴄᴏʟᴏʀ',usage:'†randomcolor',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const hex='#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
await ctx.reply('🎨 *ʀᴀɴᴅᴏᴍ ᴄᴏʟᴏʀ*\n\n🎨 ʜᴇx: *'+hex+'*\n🔴 ʀɢʙ: *rgb('+r+','+g+','+b+')*'+s.FOOTER);}};

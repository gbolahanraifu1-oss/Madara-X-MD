'use strict';
const axios=require('axios');
module.exports={name:'binary',aliases:['bincode','texttobin'],category:'misc',desc:'ᴛᴇxᴛ ᴛᴏ ʙɪɴᴀʀʏ',usage:'†binary <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const text=args.join(' ');if(!text)return ctx.reply('❌ '+s.prefix+'binary hello'+s.FOOTER);
const bin=text.split('').map(c=>c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');
await ctx.reply('💾 *ʙɪɴᴀʀʏ:*\n\n'+bin+s.FOOTER);}};

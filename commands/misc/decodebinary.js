'use strict';
const axios=require('axios');
module.exports={name:'decodebinary',aliases:['frombin','bintotext'],category:'misc',desc:'ʙɪɴᴀʀʏ ᴛᴏ ᴛᴇxᴛ',usage:'†decodebinary <binary>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const text=args.join(' ');if(!text)return ctx.reply('❌ '+s.prefix+'decodebinary 01101000'+s.FOOTER);
try{const decoded=text.split(' ').map(b=>String.fromCharCode(parseInt(b,2))).join('');
await ctx.reply('🔓 *ᴅᴇᴄᴏᴅᴇᴅ:*\n\n'+decoded+s.FOOTER);}
catch{await ctx.reply('❌ ɪɴᴠᴀʟɪᴅ ʙɪɴᴀʀʏ.'+s.FOOTER);}}};

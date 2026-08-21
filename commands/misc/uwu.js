'use strict';
const axios=require('axios');
module.exports={name:'uwu',aliases:['uwutext','kawaii'],category:'misc',desc:'ᴄᴏɴᴠᴇʀᴛ ᴛᴇxᴛ ᴛᴏ ᴜᴡᴜ',usage:'†uwu <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const text=args.join(' ');if(!text)return ctx.reply('❌ '+s.prefix+'uwu hello friend'+s.FOOTER);
const uwu=text.replace(/r|l/g,'w').replace(/R|L/g,'W').replace(/n([aeiou])/g,'ny$1').replace(/N([aeiou])/g,'Ny$1').replace(/ove/g,'uv');
await ctx.reply('✨ '+uwu+' uwu'+s.FOOTER);}};

'use strict';
const axios=require('axios');
module.exports={name:'vaporwave',aliases:['vapor','aesthetictext'],category:'misc',desc:'ᴠᴀᴘᴏʀᴡᴀᴠᴇ ᴛᴇxᴛ',usage:'†vaporwave <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const text=args.join(' ');if(!text)return ctx.reply('❌ '+s.prefix+'vaporwave hello'+s.FOOTER);
const v=text.split('').map(c=>{const code=c.charCodeAt(0);return(code>=33&&code<=126)?String.fromCharCode(code+65248):c}).join('');
await ctx.reply('✨ '+v+s.FOOTER);}};

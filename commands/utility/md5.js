'use strict';
const axios=require('axios');
module.exports={name:'md5',aliases:['hash','md5hash'],category:'utility',desc:'ɢᴇɴᴇʀᴀᴛᴇ ᴍᴅ5 ʜᴀsʜ',usage:'†md5 <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'md5 hello'+s.FOOTER);
const hash=require('crypto').createHash('md5').update(q).digest('hex');
await ctx.reply('🔑 *ᴍᴅ5:*\n\n'+hash+s.FOOTER);}};

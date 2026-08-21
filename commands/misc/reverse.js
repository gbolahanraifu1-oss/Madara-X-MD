'use strict';
const axios=require('axios');
module.exports={name:'reverse',aliases:['rev','reversetext'],category:'misc',desc:'ʀᴇᴠᴇʀsᴇ ᴛᴇxᴛ',usage:'†reverse <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const text=args.join(' ');if(!text)return ctx.reply('❌ '+s.prefix+'reverse hello'+s.FOOTER);
await ctx.reply('🔄 *'+text.split('').reverse().join('')+'*'+s.FOOTER);}};

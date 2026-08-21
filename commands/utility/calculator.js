'use strict';
const axios=require('axios');
module.exports={name:'calculator',aliases:['calc','math','solve'],category:'utility',desc:'ᴄᴀʟᴄᴜʟᴀᴛᴇ ᴇxᴘʀᴇssɪᴏɴ',usage:'†calc <expr>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'calc 2+2'+s.FOOTER);
try{const r=require('mathjs').evaluate(q);await ctx.reply('🔢 *'+q+' = '+r+'*'+s.FOOTER);}
catch{await ctx.reply('❌ ɪɴᴠᴀʟɪᴅ ᴇxᴘʀᴇssɪᴏɴ.'+s.FOOTER);}}};

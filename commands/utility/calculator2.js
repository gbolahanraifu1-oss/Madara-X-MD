'use strict';
const axios=require('axios');
module.exports={name:'calculator2',aliases:['eval2','compute'],category:'utility',desc:'ᴄᴏᴍᴘʀᴇʜᴇɴsɪᴠᴇ ᴄᴀʟᴄᴜʟᴀᴛᴏʀ',usage:'†calculator2 <expr>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'calculator2 sin(90)*2'+s.FOOTER);
try{const math=require('mathjs');const r=math.evaluate(q);
await ctx.reply('🧮 *ᴄᴀʟᴄᴜʟᴀᴛᴏʀ*\n\n📝 '+q+'\n✅ = *'+r+'*'+s.FOOTER);}
catch(e){await ctx.reply('❌ ɪɴᴠᴀʟɪᴅ ᴇxᴘʀᴇssɪᴏɴ.'+s.FOOTER);}}};

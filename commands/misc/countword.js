'use strict';
const axios=require('axios');
module.exports={name:'countword',aliases:['wordcount','wc'],category:'misc',desc:'ᴄᴏᴜɴᴛ ᴡᴏʀᴅs ɪɴ ᴛᴇxᴛ',usage:'†countword <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const text=args.join(' ');if(!text)return ctx.reply('❌ '+s.prefix+'countword your text here'+s.FOOTER);
const words=text.trim().split(/\s+/).length,chars=text.length,chars_ns=text.replace(/\s/g,'').length;
await ctx.reply('📊 *ᴡᴏʀᴅ ᴄᴏᴜɴᴛ*\n\n📝 ᴡᴏʀᴅs: *'+words+'*\n🔤 ᴄʜᴀʀs: *'+chars+'*\n✂️ ɴᴏ sᴘᴀᴄᴇ: *'+chars_ns+'*'+s.FOOTER);}};

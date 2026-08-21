'use strict';
const axios=require('axios');
module.exports={name:'shorturl',aliases:['short','tinyurl','shorten'],category:'utility',desc:'sʜᴏʀᴛᴇɴ ᴀ ᴜʀʟ',usage:'†shorturl <url>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const url=args[0];if(!url)return ctx.reply('❌ '+s.prefix+'shorturl https://example.com'+s.FOOTER);
try{const r=await require('axios').get('https://tinyurl.com/api-create.php?url='+encodeURIComponent(url));
await ctx.reply('🔗 *sʜᴏʀᴛ ᴜʀʟ:*\n\n'+r.data+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

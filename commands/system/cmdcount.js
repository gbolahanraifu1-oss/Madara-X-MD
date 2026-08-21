'use strict';
module.exports={name:'cmdcount',aliases:['totalcmds','howmanycmds'],category:'system',desc:'sʜᴏᴡ ᴛᴏᴛᴀʟ ᴄᴍᴅ ᴄᴏᴜɴᴛ',usage:'†cmdcount',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const{getCategories}=require('../../lib/loader');
const cats=getCategories();
const total=[...cats.values()].reduce((a,b)=>a+b.length,0);
const lines=[...cats.entries()].map(([k,v])=>k+': *'+v.length+'*').join('\n');
await ctx.reply('📦 *ᴄᴏᴍᴍᴀɴᴅ ᴄᴏᴜɴᴛ*\n\n'+lines+'\n\n✅ ᴛᴏᴛᴀʟ: *'+total+'*'+s.FOOTER);}};

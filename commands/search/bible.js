'use strict';
const axios=require('axios');
module.exports={name:'bible',aliases:['scripture','bibleverseq'],category:'search',desc:'sᴇᴀʀᴄʜ ʙɪʙʟᴇ ᴠᴇʀsᴇ',usage:'†bible <book chapter:verse>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'bible John 3:16'+s.FOOTER);
try{const r=await require('axios').get('https://bible-api.com/'+encodeURIComponent(q));
await ctx.reply('✝️ *'+r.data.reference+'*\n\n'+r.data.text+s.FOOTER);}
catch{await ctx.reply('❌ ᴠᴇʀsᴇ ɴᴏᴛ ғᴏᴜɴᴅ.'+s.FOOTER);}}};

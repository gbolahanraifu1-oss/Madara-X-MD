'use strict';
const axios=require('axios');
module.exports={name:'leet',aliases:['1337','leetspeak'],category:'misc',desc:'ᴄᴏɴᴠᴇʀᴛ ᴛᴏ ʟᴇᴇᴛsᴘᴇᴀᴋ',usage:'†leet <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const MAP={a:'4',e:'3',i:'1',o:'0',s:'5',t:'7',b:'8',g:'9',l:'1'};
const text=args.join(' ');if(!text)return ctx.reply('❌ '+s.prefix+'leet hello'+s.FOOTER);
await ctx.reply('💻 '+text.toLowerCase().split('').map(c=>MAP[c]||c).join('').toUpperCase()+s.FOOTER);}};

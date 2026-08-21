'use strict';
const axios=require('axios');
module.exports={name:'tinytext',aliases:['tinyfont','smalltext'],category:'misc',desc:'ᴛɪɴʏ ᴛᴇxᴛ ᴄᴏɴᴠᴇʀᴛᴇʀ',usage:'†tinytext <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const MAP={a:'ᵃ',b:'ᵇ',c:'ᶜ',d:'ᵈ',e:'ᵉ',f:'ᶠ',g:'ᵍ',h:'ʰ',i:'ⁱ',j:'ʲ',k:'ᵏ',l:'ˡ',m:'ᵐ',n:'ⁿ',o:'ᵒ',p:'ᵖ',q:'q',r:'ʳ',s:'ˢ',t:'ᵗ',u:'ᵘ',v:'ᵛ',w:'ʷ',x:'ˣ',y:'ʸ',z:'ᶻ'};
const text=args.join(' ');if(!text)return ctx.reply('❌ '+s.prefix+'tinytext hello'+s.FOOTER);
await ctx.reply('🔡 '+text.toLowerCase().split('').map(c=>MAP[c]||c).join('')+s.FOOTER);}};

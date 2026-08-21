'use strict';
module.exports={name:'inventory',aliases:['inv','bag'],category:'finance',desc:'ᴠɪᴇᴡ ʏᴏᴜʀ ɪɴᴠᴇɴᴛᴏʀʏ',usage:'†inventory',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const db=require('../../lib/database'),num=ctx.sender.split('@')[0];
const inv=db.getUser(num,'inventory')||{};
const items=Object.entries(inv).filter(([,v])=>v>0).map(([k,v])=>k+' x'+v).join('\n')||'_ᴇᴍᴘᴛʏ_';
await ctx.reply('🎒 *ɪɴᴠᴇɴᴛᴏʀʏ*\n\n'+items+s.FOOTER);}};

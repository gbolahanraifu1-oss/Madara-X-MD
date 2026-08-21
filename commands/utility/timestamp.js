'use strict';
const axios=require('axios');
module.exports={name:'timestamp',aliases:['unix','epoch','time2'],category:'utility',desc:'ɢᴇᴛ ᴜɴɪx ᴛɪᴍᴇsᴛᴀᴍᴘ',usage:'†timestamp',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const now=Date.now();const d=new Date(now);
await ctx.reply('⏰ *ᴛɪᴍᴇsᴛᴀᴍᴘ*\n\n🔢 ᴜɴɪx: *'+now+'*\n📅 ᴜᴛᴄ: *'+d.toUTCString()+'*\n📍 ɪsᴏ: *'+d.toISOString()+'*'+s.FOOTER);}};

'use strict';
const axios=require('axios');
module.exports={name:'number',aliases:['rng','randomnumber'],category:'misc',desc:'ɢᴇɴᴇʀᴀᴛᴇ ʀᴀɴᴅᴏᴍ ɴᴜᴍʙᴇʀ',usage:'†number [min] [max]',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const min=parseInt(args[0])||1,max=parseInt(args[1])||100;
const n=Math.floor(Math.random()*(max-min+1))+min;
await ctx.reply('🎲 *ʀᴀɴᴅᴏᴍ ɴᴜᴍʙᴇʀ*\n\nʀᴀɴɢᴇ: '+min+'-'+max+'\nʀᴇsᴜʟᴛ: *'+n+'*'+s.FOOTER);}};

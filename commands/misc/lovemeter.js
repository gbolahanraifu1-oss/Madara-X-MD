'use strict';
const axios=require('axios');
module.exports={name:'lovemeter',aliases:['lovecalc2','lovelevel'],category:'misc',desc:'ᴄᴀʟᴄᴜʟᴀᴛᴇ ʟᴏᴠᴇ',usage:'†lovemeter <name1> <name2>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const n1=args[0]||ctx.pushName,n2=args[1]||s.botName;
const pct=Math.floor(Math.random()*101);
const hearts='❤️'.repeat(Math.floor(pct/10))+'🖤'.repeat(10-Math.floor(pct/10));
await ctx.reply('💕 *ʟᴏᴠᴇ ᴍᴇᴛᴇʀ*\n\n'+n1+' & '+n2+'\n\n'+hearts+'\n\n*'+pct+'%* ᴄᴏᴍᴘᴀᴛɪʙʟᴇ!'+s.FOOTER);}};

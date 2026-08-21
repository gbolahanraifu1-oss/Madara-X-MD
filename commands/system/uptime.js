'use strict';
module.exports={name:'uptime',aliases:['up','runtime2'],category:'system',desc:'sʜᴏᴡ ʙᴏᴛ ᴜᴘᴛɪᴍᴇ',usage:'†uptime',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const t=process.uptime();const h=Math.floor(t/3600),m=Math.floor(t%3600/60),ss=Math.floor(t%60);
await ctx.reply('⏱️ *ᴜᴘᴛɪᴍᴇ:* *'+h+'ʜ '+m+'ᴍ '+ss+'s*'+s.FOOTER);}};

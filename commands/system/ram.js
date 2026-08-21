'use strict';
module.exports={name:'ram',aliases:['memory','memusage'],category:'system',desc:'sʜᴏᴡ ʀᴀᴍ ᴜsᴀɢᴇ',usage:'†ram',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const m=process.memoryUsage(),os=require('os');
await ctx.reply('💾 *ᴍᴇᴍᴏʀʏ*\n\n🟢 ʜᴇᴀᴘ: *'+Math.round(m.heapUsed/1048576)+'/'+ Math.round(m.heapTotal/1048576)+'ᴍʙ*\n📊 ʀss: *'+Math.round(m.rss/1048576)+'ᴍʙ*\n🖥️ sʏs ʀᴀᴍ: *'+Math.round((os.totalmem()-os.freemem())/1048576)+'/'+Math.round(os.totalmem()/1048576)+'ᴍʙ*'+s.FOOTER);}};

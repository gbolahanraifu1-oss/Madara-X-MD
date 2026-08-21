'use strict';
module.exports={name:'rate',aliases:['rateme','scoreme'],category:'fun',desc:'ʀᴀᴛᴇ sᴏᴍᴇᴛʜɪɴɢ',usage:'†rate <thing>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ')||ctx.pushName;
const score=Math.floor(Math.random()*101);
const emoji=score>80?'🔥':score>60?'😍':score>40?'😊':score>20?'😐':'💀';
await ctx.reply(emoji+' *'+q+'*\n\n⭐ ᴩᴏɪɴᴛs: *'+score+'/100*'+s.FOOTER);}};

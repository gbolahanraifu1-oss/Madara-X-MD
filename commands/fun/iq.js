'use strict';
module.exports={name:'iq',aliases:['iqlevel','smartness'],category:'fun',desc:'ᴄʜᴇᴄᴋ ʏᴏᴜʀ ɪQ̲',usage:'†iq',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const score=Math.floor(Math.random()*201);
const label=score>150?'🧠 ɢᴇɴɪᴜs':score>120?'📚 sᴍᴀʀᴛ':score>90?'😊 ᴀᴠᴇʀᴀɢᴇ':score>60?'🤔 ʙᴇʟᴏᴡ ᴀᴠɢ':'💀 ᴜʜᴏʜ';
await ctx.reply('🧠 *ɪQ̲ ᴛᴇsᴛ*\n\nʏᴏᴜʀ ɪQ̲: *'+score+'*\n\n'+label+s.FOOTER);}};

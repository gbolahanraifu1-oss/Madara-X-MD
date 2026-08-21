'use strict';
module.exports={name:'hot',aliases:['amihot','attractiveness'],category:'fun',desc:'ᴄʜᴇᴄᴋ ʜᴏᴛɴᴇss ʟᴇᴠᴇʟ',usage:'†hot',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const pct=Math.floor(Math.random()*101);
const bars='🔥'.repeat(Math.floor(pct/10))+'⬜'.repeat(10-Math.floor(pct/10));
await ctx.reply('🌡️ *ʜᴏᴛɴᴇss ʟᴇᴠᴇʟ*\n\n'+bars+'\n*'+pct+'%*\n\n'+(pct>80?'sᴛᴏᴘ ʏᴏᴜ\'ʀᴇ ᴏɴ ғɪʀᴇ 🔥':pct>50?'ɴᴏᴛ ʙᴀᴅ 😏':'ᴋᴇᴇᴘ ᴛʀʏɪɴɢ 💀')+s.FOOTER);}};

'use strict';
module.exports={name:'emojimix',aliases:['emix','mixemoji'],category:'sticker',desc:'ᴍɪx ᴛᴡᴏ ᴇᴍᴏᴊɪs',usage:'†emojimix <emoji1> <emoji2>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const [e1,e2]=[args[0],args[1]];
if(!e1||!e2)return ctx.reply('❌ *ᴜsᴀɢᴇ:* '+s.prefix+'emojimix 😂 🔥'+s.FOOTER);
try{const c1=e1.codePointAt(0).toString(16),c2=e2.codePointAt(0).toString(16);
const url='https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u'+c1+'/u'+c1+'_u'+c2+'.png';
await sock.sendMessage(ctx.from,{image:{url},caption:'✨ '+e1+'+'+e2+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ ᴄᴏᴍʙᴏ ɴᴏᴛ sᴜᴘᴘᴏʀᴛᴇᴅ.'+s.FOOTER);}}};

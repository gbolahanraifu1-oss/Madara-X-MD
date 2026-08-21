'use strict';
module.exports={name:'broadcast2',aliases:['bc2','sendall2'],category:'owner',desc:'ʙʀᴏᴀᴅᴄᴀsᴛ ᴠɪᴀ ᴡᴀ',usage:'†broadcast2 <text>',ownerOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isDevOwner)return ctx.reply('⛔ *ᴅᴇᴠ ᴏɴʟʏ.*'+s.FOOTER);
const text=args.join(' ');if(!text)return ctx.reply('❌ ᴇɴᴛᴇʀ ᴀ ᴍᴇssᴀɢᴇ.'+s.FOOTER);
const{activeSessions}=require('../../lib/pairManager');
let count=0;
for(const[phone,sess]of activeSessions.entries()){
if(sess.connected&&sess.sock){try{await sess.sock.sendMessage(phone+'@s.whatsapp.net',{text:'📢 *ʙʀᴏᴀᴅᴄᴀsᴛ*\n\n'+text+s.FOOTER});count++;}catch{}}
}
await ctx.reply('✅ sᴇɴᴛ ᴛᴏ *'+count+'* sᴇssɪᴏɴs.'+s.FOOTER);}};

'use strict';
module.exports={name:'spam',aliases:['spamtest','sendspam'],category:'system',desc:'sᴘᴀᴍ ᴀ ᴍᴇssᴀɢᴇ ɴ ᴛɪᴍᴇs',usage:'†spam <count> <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isOwner)return ctx.reply('⛔ ᴏᴡɴᴇʀ ᴏɴʟʏ.'+s.FOOTER);
const count=Math.min(parseInt(args[0])||5,20),text=args.slice(1).join(' ')||'ᴍᴀᴅᴀʀᴀ x-ᴍᴅ 🔥';
for(let i=0;i<count;i++){await sock.sendMessage(ctx.from,{text:text},{quoted:msg});await new Promise(r=>setTimeout(r,300));}}};

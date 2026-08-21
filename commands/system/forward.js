'use strict';
module.exports={name:'forward',aliases:['fwd','forwardmsg'],category:'system',desc:'ғᴏʀᴡᴀʀᴅ ᴀ ᴍᴇssᴀɢᴇ',usage:'†forward (reply to message)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isOwner)return ctx.reply('⛔ ᴏᴡɴᴇʀ ᴏɴʟʏ.'+s.FOOTER);
const quoted=msg.message?.extendedTextMessage?.contextInfo;
if(!quoted?.quotedMessage)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴍᴇssᴀɢᴇ.'+s.FOOTER);
await sock.sendMessage(ctx.from,{forward:{key:{remoteJid:ctx.from,id:quoted.stanzaId},message:quoted.quotedMessage}},{quoted:msg});}};

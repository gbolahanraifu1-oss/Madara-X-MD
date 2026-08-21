'use strict';
module.exports={name:'deletemsg',aliases:['del','unsend'],category:'owner',desc:'ᴅᴇʟᴇᴛᴇ ᴀ ᴍᴇssᴀɢᴇ',usage:'†delete (reply to message)',ownerOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
const quoted=msg.message?.extendedTextMessage?.contextInfo;
if(!quoted?.stanzaId)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴍᴇssᴀɢᴇ.'+s.FOOTER);
const key={remoteJid:ctx.from,id:quoted.stanzaId,participant:quoted.participant,fromMe:false};
await sock.sendMessage(ctx.from,{delete:key});}};

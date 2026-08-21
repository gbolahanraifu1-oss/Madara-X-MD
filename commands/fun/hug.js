'use strict';
module.exports={name:'hug',aliases:['sendhug2','huguser'],category:'fun',desc:'sᴇɴᴅ ᴀ ʜᴜɢ',usage:'†hug @user',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const jid=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
const name=jid?'@'+jid.split('@')[0]:'sᴏᴍᴇᴏɴᴇ';
await sock.sendMessage(ctx.from,{text:'🤗 *'+ctx.pushName+'* ɢɪᴠᴇs ᴀ ᴡᴀʀᴍ ʜᴜɢ ᴛᴏ '+name+'! 💕',mentions:jid?[jid]:[]},{quoted:msg});}};

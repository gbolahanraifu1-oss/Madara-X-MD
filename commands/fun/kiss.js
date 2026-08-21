'use strict';
module.exports={name:'kiss',aliases:['kissmsg','sendhug'],category:'fun',desc:'sᴇɴᴅ ᴀ ᴠɪʀᴛᴜᴀʟ ᴋɪss',usage:'†kiss @user',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const jid=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
const name=jid?'@'+jid.split('@')[0]:'sᴏᴍᴇᴏɴᴇ sᴘᴇᴄɪᴀʟ';
await sock.sendMessage(ctx.from,{text:'💋 *'+ctx.pushName+'* sᴇɴᴅs ᴀ ᴋɪss ᴛᴏ '+name+'! 😘',mentions:jid?[jid]:[]},{quoted:msg});}};

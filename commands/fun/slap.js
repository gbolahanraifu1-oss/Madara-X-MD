'use strict';
module.exports={name:'slap',aliases:['slapmsg','hituser'],category:'fun',desc:'sʟᴀᴘ sᴏᴍᴇᴏɴᴇ',usage:'†slap @user',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const jid=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
const name=jid?'@'+jid.split('@')[0]:'sᴏᴍᴇᴏɴᴇ';
await sock.sendMessage(ctx.from,{text:'👋 *'+ctx.pushName+'* sʟᴀᴘs '+name+'! 😤💢',mentions:jid?[jid]:[]},{quoted:msg});}};

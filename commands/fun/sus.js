'use strict';
module.exports={name:'sus',aliases:['amogus','suspicious'],category:'fun',desc:'sᴜs ᴄʜᴇᴄᴋ',usage:'†sus @user',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const jid=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
const name=jid?'@'+jid.split('@')[0]:ctx.pushName;
const pct=Math.floor(Math.random()*101);
await sock.sendMessage(ctx.from,{text:'📮 *sᴜs ᴄʜᴇᴄᴋ*\n\n'+name+' ɪs *'+pct+'%* sᴜs!\n\n'+(pct>70?'ᴇᴊᴇᴄᴛ ᴛʜᴇᴍ! 🚀':'ᴛʜᴇʏ ᴀʀᴇ ᴄʟᴇᴀɴ ✅'),mentions:jid?[jid]:[]},{quoted:msg});}};

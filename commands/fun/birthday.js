'use strict';
module.exports={name:'birthday',aliases:['hbd','wishbday'],category:'fun',desc:'sᴇɴᴅ ʙɪʀᴛʜᴅᴀʏ ᴡɪsʜ',usage:'†birthday @user',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const jid=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
const name=jid?'@'+jid.split('@')[0]:'ʏᴏᴜ';
await sock.sendMessage(ctx.from,{text:'🎂🎉 *ʜᴀᴘᴘʏ ʙɪʀᴛʜᴅᴀʏ '+name+'!* 🎈\n\n🌟 ᴍᴀʏ ᴀʟʟ ʏᴏᴜʀ ᴅʀᴇᴀᴍs ᴄᴏᴍᴇ ᴛʀᴜᴇ!\n🎁 ʜᴀᴠᴇ ᴀɴ ᴀᴍᴀᴢɪɴɢ ʏᴇᴀʀ ᴀʜᴇᴀᴅ!\n\n— ᴍᴀᴅᴀʀᴀ x-ᴍᴅ',mentions:jid?[jid]:[]},{quoted:msg});}};

'use strict';
const axios=require('axios');
module.exports={name:'compliment2',aliases:['nicethings','praise2'],category:'misc',desc:'sᴇɴᴅ ᴄᴏᴍᴘʟɪᴍᴇɴᴛ ᴛᴏ ᴜsᴇʀ',usage:'†compliment2 @user',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const jid=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
const C=['ʏᴏᴜ ᴀʀᴇ ᴀᴍᴀᴢɪɴɢ!','ʏᴏᴜ ᴍᴀᴋᴇ ᴛʜᴇ ᴡᴏʀʟᴅ ʙᴇᴛᴛᴇʀ!','ʏᴏᴜʀ sᴍɪʟᴇ ɪs ᴄᴏɴᴛᴀɢɪᴏᴜs!','ʏᴏᴜ ᴀʀᴇ ᴛʀᴜʟʏ ᴏɴᴇ ᴏғ ᴀ ᴋɪɴᴅ!'];
const name=jid?'@'+jid.split('@')[0]:ctx.pushName;
await sock.sendMessage(ctx.from,{text:'🌸 *ᴄᴏᴍᴘʟɪᴍᴇɴᴛ ғᴏʀ '+name+'*\n\n'+C[Math.floor(Math.random()*C.length)],mentions:jid?[jid]:[]},{quoted:msg});}};

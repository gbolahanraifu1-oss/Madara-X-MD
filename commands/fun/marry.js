'use strict';
module.exports={name:'marry',aliases:['propose2','weddingq'],category:'fun',desc:'ᴘʀᴏᴘᴏsᴇ ᴍᴀʀʀɪᴀɢᴇ',usage:'†marry @user',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const jid=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
if(!jid)return ctx.reply('❌ ᴍᴇɴᴛɪᴏɴ sᴏᴍᴇᴏɴᴇ.'+s.FOOTER);
const accept=Math.random()>0.4;
await sock.sendMessage(ctx.from,{text:'💍 *'+ctx.pushName+'* ᴘʀᴏᴘᴏsᴇs ᴛᴏ @'+jid.split('@')[0]+'!\n\n'+(accept?'💕 ᴛʜᴇʏ sᴀɪᴅ *ʏᴇs!* 🎊':'💔 ᴛʜᴇʏ sᴀɪᴅ *ɴᴏ* 😢'),mentions:[jid]},{quoted:msg});}};

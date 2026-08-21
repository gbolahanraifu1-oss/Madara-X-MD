'use strict';
module.exports={name:'mediainfo',aliases:['vidinfo','fileinfo'],category:'media',desc:'ɢᴇᴛ ᴍᴇᴅɪᴀ ᴍᴇᴛᴀᴅᴀᴛᴀ',usage:'†mediainfo (reply to media)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const quoted=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const media=quoted?.imageMessage||quoted?.videoMessage||quoted?.audioMessage||quoted?.documentMessage;
if(!media)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴍᴇᴅɪᴀ.'+s.FOOTER);
const type=quoted?.imageMessage?'🖼️ ɪᴍᴀɢᴇ':quoted?.videoMessage?'🎥 ᴠɪᴅᴇᴏ':quoted?.audioMessage?'🎵 ᴀᴜᴅɪᴏ':'📄 ᴅᴏᴄ';
await ctx.reply(type+' *ᴍᴇᴅɪᴀ ɪɴғᴏ*\n\n📦 sɪᴢᴇ: '+(media.fileLength?(media.fileLength/1024).toFixed(1)+'ᴋʙ':'ɴ/ᴀ')+'\n🔑 ᴍɪᴍᴇ: '+(media.mimetype||'ɴ/ᴀ')+'\n📐 ᴅɪᴍs: '+(media.width&&media.height?media.width+'x'+media.height:'ɴ/ᴀ')+'\n⏱️ ᴅᴜʀ: '+(media.seconds?media.seconds+'s':'ɴ/ᴀ')+s.FOOTER);}};

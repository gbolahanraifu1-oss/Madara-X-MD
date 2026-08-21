'use strict';
module.exports={name:'imgformat',aliases:['topng','tojpeg','convertimg'],category:'converter',desc:'ᴄᴏɴᴠᴇʀᴛ ɪᴍᴀɢᴇ ғᴏʀᴍᴀᴛ',usage:'†imgformat png/jpg (reply to image)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const fmt=(args[0]||'png').toLowerCase();
if(!['png','jpg','jpeg','webp'].includes(fmt))return ctx.reply('❌ ᴠᴀʟɪᴅ: png,jpg,webp'+s.FOOTER);
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const imgMsg=q?.imageMessage||msg.message?.imageMessage;
if(!imgMsg)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ.'+s.FOOTER);
await ctx.react('⏳');
try{const{downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const sharp=require('sharp');
const out=fmt==='png'?await sharp(buf).png().toBuffer():fmt==='webp'?await sharp(buf).webp().toBuffer():await sharp(buf).jpeg({quality:90}).toBuffer();
await sock.sendMessage(ctx.from,{document:out,mimetype:fmt==='png'?'image/png':fmt==='webp'?'image/webp':'image/jpeg',fileName:'image.'+fmt,caption:'🖼️ ᴄᴏɴᴠᴇʀᴛᴇᴅ!'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

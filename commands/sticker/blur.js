'use strict';
module.exports={name:'blur',aliases:['blurimage','imgblur'],category:'sticker',desc:'ʙʟᴜʀ ᴀɴ ɪᴍᴀɢᴇ',usage:'†blur (reply to image)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const imgMsg=q?.imageMessage||msg.message?.imageMessage;
if(!imgMsg)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ.'+s.FOOTER);
await ctx.react('⏳');
try{const {downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const sharp=require('sharp');const out=await sharp(buf).blur(15).toBuffer();
await sock.sendMessage(ctx.from,{image:out,caption:'🌫️ ʙʟᴜʀʀᴇᴅ!'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

'use strict';
module.exports={name:'compress',aliases:['imgcompress','optimize'],category:'converter',desc:'ᴄᴏᴍᴘʀᴇss ᴀɴ ɪᴍᴀɢᴇ',usage:'†compress (reply to image)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const imgMsg=q?.imageMessage||msg.message?.imageMessage;
if(!imgMsg)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ.'+s.FOOTER);
await ctx.react('⏳');
try{const{downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const before=buf.length;
const sharp=require('sharp');const out=await sharp(buf).jpeg({quality:40}).toBuffer();
await sock.sendMessage(ctx.from,{image:out,caption:'📦 '+Math.round(before/1024)+'KB → '+Math.round(out.length/1024)+'KB'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

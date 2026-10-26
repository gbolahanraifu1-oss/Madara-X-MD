'use strict';
module.exports={name:'resize',aliases:['imgsize','imgresize'],category:'converter',desc:'ʀᴇsɪᴢᴇ ᴀɴ ɪᴍᴀɢᴇ',usage:'†resize <width>x<height> (reply to image)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const dim=(args[0]||'512x512').split('x');
const w2=parseInt(dim[0])||512,h2=parseInt(dim[1])||512;
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const imgMsg=q?.imageMessage||msg.message?.imageMessage;
if(!imgMsg)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ.'+s.FOOTER);
await ctx.react('⏳');
try{const{downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const sharp=require('sharp');const out=await sharp(buf).resize(w2,h2,{fit:'fill'}).toBuffer();
await sock.sendMessage(ctx.from,{image:out,caption:'📐 '+w2+'x'+h2+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

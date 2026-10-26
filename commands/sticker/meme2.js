'use strict';
module.exports={name:'meme2',aliases:['mememaker','makememe'],category:'sticker',desc:'ᴄʀᴇᴀᴛᴇ ᴀ ᴍᴇᴍᴇ',usage:'†meme2 <top>|<bottom> (reply to image)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const text=args.join(' ');if(!text)return ctx.reply('❌ '+s.prefix+'meme2 top text|bottom text'+s.FOOTER);
const [top,bottom]=(text+'|').split('|');
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const imgMsg=q?.imageMessage||msg.message?.imageMessage;
if(!imgMsg)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ.'+s.FOOTER);
await ctx.react('⏳');
try{const {downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const Jimp=require('jimp');const img=await Jimp.read(buf);
const font=await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
img.print(font,0,10,{text:top,alignmentX:Jimp.HORIZONTAL_ALIGN_CENTER},img.bitmap.width);
img.print(font,0,img.bitmap.height-50,{text:bottom||'',alignmentX:Jimp.HORIZONTAL_ALIGN_CENTER},img.bitmap.width);
const out=await img.getBufferAsync(Jimp.MIME_JPEG);
await sock.sendMessage(ctx.from,{image:out,caption:'😂'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

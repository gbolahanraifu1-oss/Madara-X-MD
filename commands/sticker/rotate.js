'use strict';
module.exports={name:'rotate',aliases:['rotateimage','imgrotate'],category:'sticker',desc:'ʀᴏᴛᴀᴛᴇ ᴀɴ ɪᴍᴀɢᴇ',usage:'†rotate [90/180/270] (reply to image)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const deg=parseInt(args[0])||90;
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const imgMsg=q?.imageMessage||msg.message?.imageMessage;
if(!imgMsg)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ.'+s.FOOTER);
await ctx.react('⏳');
try{const {downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const sharp=require('sharp');const out=await sharp(buf).rotate(deg).toBuffer();
await sock.sendMessage(ctx.from,{image:out,caption:'🔄 ʀᴏᴛᴀᴛᴇᴅ '+deg+'°'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

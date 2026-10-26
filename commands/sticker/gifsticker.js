'use strict';
module.exports={name:'gifsticker',aliases:['gifstickerpack','gifpack'],category:'sticker',desc:'ᴄᴏɴᴠᴇʀᴛ ɢɪғ ᴛᴏ sᴛɪᴄᴋᴇʀ',usage:'†gifsticker (reply to gif/video)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const vidMsg=q?.videoMessage||msg.message?.videoMessage;
if(!vidMsg)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀ ɢɪғ/ᴠɪᴅᴇᴏ.'+s.FOOTER);
await ctx.react('⏳');
try{const {downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const {Sticker,StickerTypes}=require('../../lib/sticker');
const stk=new Sticker(buf,{pack:s.botName,author:s.ownerName,type:StickerTypes.ANIMATED,quality:70});
await sock.sendMessage(ctx.from,{sticker:await stk.toBuffer()},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

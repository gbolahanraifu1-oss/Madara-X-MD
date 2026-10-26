'use strict';
module.exports={name:'take',aliases:['steal','takesticker'],category:'sticker',desc:'sᴀᴠᴇ sᴛɪᴄᴋᴇʀ ᴡɪᴛʜ ʙᴏᴛ ɪɴғᴏ',usage:'†take (reply to sticker)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const stk=q?.stickerMessage||msg.message?.stickerMessage;
if(!stk)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀ sᴛɪᴄᴋᴇʀ.'+s.FOOTER);
await ctx.react('⏳');
try{const {downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const {Sticker,StickerTypes}=require('../../lib/sticker');
const sticker=new Sticker(buf,{pack:s.botName,author:s.ownerName,type:StickerTypes.DEFAULT});
await sock.sendMessage(ctx.from,{sticker:await sticker.toBuffer()},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

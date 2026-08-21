'use strict';
module.exports={name:'toimg',aliases:['stickertoimg','webptoimg','s2img'],category:'sticker',desc:'ᴄᴏɴᴠᴇʀᴛ sᴛɪᴄᴋᴇʀ ᴛᴏ ɪᴍᴀɢᴇ',usage:'†toimg (reply to sticker)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const stk=q?.stickerMessage||msg.message?.stickerMessage;
if(!stk)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀ sᴛɪᴄᴋᴇʀ.'+s.FOOTER);
await ctx.react('⏳');
try{const {downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const sharp=require('sharp');const png=await sharp(buf).png().toBuffer();
await sock.sendMessage(ctx.from,{image:png,caption:'🖼️'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

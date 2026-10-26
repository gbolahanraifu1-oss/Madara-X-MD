'use strict';
module.exports={name:'webp2mp4',aliases:['sticktovid','webptovid'],category:'converter',desc:'ᴄᴏɴᴠᴇʀᴛ ᴀɴɪᴍᴀᴛᴇᴅ sᴛɪᴄᴋᴇʀ ᴛᴏ ᴠɪᴅᴇᴏ',usage:'†webp2mp4 (reply to sticker)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const stk=q?.stickerMessage||msg.message?.stickerMessage;
if(!stk)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀ sᴛɪᴄᴋᴇʀ.'+s.FOOTER);
await ctx.react('⏳');
try{const{downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const{ffmpeg}=require('../../lib/converter');
const mp4=await ffmpeg(buf,['-vf','scale=512:512','-pix_fmt','yuv420p'],'webp','mp4');
await sock.sendMessage(ctx.from,{video:mp4,mimetype:'video/mp4',caption:'🎬'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

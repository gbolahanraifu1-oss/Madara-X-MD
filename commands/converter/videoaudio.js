'use strict';
module.exports={name:'videoaudio',aliases:['extractaudio','vid2audio'],category:'converter',desc:'ᴇxᴛʀᴀᴄᴛ ᴀᴜᴅɪᴏ ғʀᴏᴍ ᴠɪᴅᴇᴏ',usage:'†videoaudio (reply to video)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const v=q?.videoMessage||msg.message?.videoMessage;
if(!v)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴠɪᴅᴇᴏ.'+s.FOOTER);
await ctx.react('⏳');
try{const{downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const{ffmpeg}=require('../../lib/converter');
const out=await ffmpeg(buf,['-vn','-ab','128k','-ar','44100','-f','mp3'],'mp4','mp3');
await sock.sendMessage(ctx.from,{document:out,mimetype:'audio/mpeg',fileName:'extracted.mp3',caption:'🎵 ᴀᴜᴅɪᴏ ᴇxᴛʀᴀᴄᴛᴇᴅ!'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

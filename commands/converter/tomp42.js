'use strict';
module.exports={name:'tomp42',aliases:['videoresize','vid2mp4'],category:'converter',desc:'ʀᴇ-ᴇɴᴄᴏᴅᴇ ᴠɪᴅᴇᴏ',usage:'†tomp42 (reply to video)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const v=q?.videoMessage||msg.message?.videoMessage;
if(!v)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴠɪᴅᴇᴏ.'+s.FOOTER);
await ctx.react('⏳');
try{const{downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const{ffmpeg}=require('../../lib/converter');
const out=await ffmpeg(buf,['-c:v','libx264','-c:a','aac','-crf','28','-preset','fast'],'mp4','mp4');
await sock.sendMessage(ctx.from,{video:out,mimetype:'video/mp4',caption:'🎬'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

'use strict';
module.exports={name:'bass',aliases:['bassboost','boostaudio'],category:'converter',desc:'ʙᴀss ʙᴏᴏsᴛ ᴀᴜᴅɪᴏ',usage:'†bass (reply to audio)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const a=q?.audioMessage||msg.message?.audioMessage;
if(!a)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀᴜᴅɪᴏ.'+s.FOOTER);
await ctx.react('⏳');
try{const{downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const{ffmpeg}=require('../../lib/converter');
const out=await ffmpeg(buf,['-af','bass=g=10,dynaudnorm=f=200','-vn'],'ogg','mp3');
await sock.sendMessage(ctx.from,{document:out,mimetype:'audio/mpeg',fileName:'bassboost.mp3',caption:'🔊 ʙᴀss ʙᴏᴏsᴛᴇᴅ!'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

'use strict';
module.exports={name:'audiospeed',aliases:['speedaudio','fastaudio'],category:'converter',desc:'ᴄʜᴀɴɢᴇ ᴀᴜᴅɪᴏ sᴘᴇᴇᴅ',usage:'†audiospeed <0.5-2.0> (reply to audio)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const spd=parseFloat(args[0])||1.5;
if(spd<0.5||spd>2)return ctx.reply('❌ sᴘᴇᴇᴅ: 0.5 - 2.0'+s.FOOTER);
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const a=q?.audioMessage||msg.message?.audioMessage;
if(!a)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀᴜᴅɪᴏ.'+s.FOOTER);
await ctx.react('⏳');
try{const{downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const{ffmpeg}=require('../../lib/converter');
const out=await ffmpeg(buf,['-filter:a','atempo='+spd,'-vn'],'ogg','mp3');
await sock.sendMessage(ctx.from,{document:out,mimetype:'audio/mpeg',fileName:'audio.mp3',caption:'⚡ '+spd+'x'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

'use strict';
module.exports={name:'pitch',aliases:['pitchshift','audiop'],category:'converter',desc:'ᴄʜᴀɴɢᴇ ᴀᴜᴅɪᴏ ᴘɪᴛᴄʜ',usage:'†pitch <semitones> (reply to audio)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const semi=parseInt(args[0])||5;
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const a=q?.audioMessage||msg.message?.audioMessage;
if(!a)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀᴜᴅɪᴏ.'+s.FOOTER);
await ctx.react('⏳');
try{const{downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const{ffmpeg}=require('../../lib/converter');
const factor=Math.pow(2,semi/12);
const out=await ffmpeg(buf,['-af','asetrate=44100*'+factor+',aresample=44100','-vn'],'ogg','mp3');
await sock.sendMessage(ctx.from,{document:out,mimetype:'audio/mpeg',fileName:'pitch.mp3',caption:'🎵 ᴘɪᴛᴄʜ '+semi+' sᴇᴍɪᴛᴏɴᴇs'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

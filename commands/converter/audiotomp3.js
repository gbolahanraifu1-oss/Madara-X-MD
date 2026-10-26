'use strict';
module.exports={name:'audiotomp3',aliases:['aud2mp3','convertaudio'],category:'converter',desc:'ᴄᴏɴᴠᴇʀᴛ ᴀᴜᴅɪᴏ ᴛᴏ ᴍᴘ3',usage:'†audiotomp3 (reply to audio)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const a=q?.audioMessage||msg.message?.audioMessage;
if(!a)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀᴜᴅɪᴏ.'+s.FOOTER);
await ctx.react('⏳');
try{const{downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const{ffmpeg}=require('../../lib/converter');
const mp3=await ffmpeg(buf,['-vn','-ab','128k','-ar','44100','-f','mp3'],'ogg','mp3');
await sock.sendMessage(ctx.from,{document:mp3,mimetype:'audio/mpeg',fileName:'audio.mp3',caption:'🎵'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

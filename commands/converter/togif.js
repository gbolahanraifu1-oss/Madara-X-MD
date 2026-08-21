'use strict';
module.exports={name:'togif',aliases:['videotogif','vid2gif'],category:'converter',desc:'ᴄᴏɴᴠᴇʀᴛ ᴠɪᴅᴇᴏ ᴛᴏ ɢɪғ',usage:'†togif (reply to video)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const v=q?.videoMessage||msg.message?.videoMessage;
if(!v)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴠɪᴅᴇᴏ.'+s.FOOTER);
await ctx.react('⏳');
try{const{downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const{ffmpeg}=require('../../lib/converter');
const gif=await ffmpeg(buf,['-vf','fps=10,scale=320:-1:flags=lanczos','-loop','0'],'mp4','gif');
await sock.sendMessage(ctx.from,{video:gif,gifPlayback:true,caption:'🎞️'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

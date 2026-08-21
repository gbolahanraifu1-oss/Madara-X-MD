'use strict';
module.exports={name:'trimvideo',aliases:['cutvid','videotrim'],category:'converter',desc:'ᴛʀɪᴍ ᴀ ᴠɪᴅᴇᴏ',usage:'†trimvideo <start> <duration> (reply to video)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const start=args[0]||'0',dur=args[1]||'30';
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const v=q?.videoMessage||msg.message?.videoMessage;
if(!v)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴠɪᴅᴇᴏ.'+s.FOOTER);
await ctx.react('⏳');
try{const{downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const{ffmpeg}=require('../../lib/converter');
const out=await ffmpeg(buf,['-ss',start,'-t',dur,'-c','copy'],'mp4','mp4');
await sock.sendMessage(ctx.from,{video:out,mimetype:'video/mp4',caption:'✂️ ᴛʀɪᴍᴍᴇᴅ: '+start+'s - '+(parseInt(start)+parseInt(dur))+'s'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

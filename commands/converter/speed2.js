'use strict';
module.exports={name:'speed2',aliases:['speedvid','fastvideo'],category:'converter',desc:'ᴄʜᴀɴɢᴇ ᴠɪᴅᴇᴏ sᴘᴇᴇᴅ',usage:'†speed2 <0.5-2.0> (reply to video)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const spd=parseFloat(args[0])||2.0;
if(spd<0.25||spd>4)return ctx.reply('❌ sᴘᴇᴇᴅ: 0.25 - 4.0'+s.FOOTER);
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const v=q?.videoMessage||msg.message?.videoMessage;
if(!v)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴠɪᴅᴇᴏ.'+s.FOOTER);
await ctx.react('⏳');
try{const{downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const{ffmpeg}=require('../../lib/converter');
const out=await ffmpeg(buf,['-filter:v','setpts='+( 1/spd)+'*PTS','-filter:a','atempo='+spd],'mp4','mp4');
await sock.sendMessage(ctx.from,{video:out,mimetype:'video/mp4',caption:'⚡ '+spd+'x sᴘᴇᴇᴅ'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

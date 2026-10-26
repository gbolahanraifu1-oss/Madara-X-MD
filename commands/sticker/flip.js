'use strict';
module.exports={name:'flip',aliases:['flipimg','mirror'],category:'sticker',desc:'ᴍɪʀʀᴏʀ ᴀɴ ɪᴍᴀɢᴇ',usage:'†flip (reply to image)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const imgMsg=q?.imageMessage||msg.message?.imageMessage;
if(!imgMsg)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ.'+s.FOOTER);
await ctx.react('⏳');
try{const {downloadMediaMessage}=require('@itsliaaa/baileys');
const target=q?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:q}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const sharp=require('sharp');const out=await sharp(buf).flop().toBuffer();
await sock.sendMessage(ctx.from,{image:out,caption:'↔️ ғʟɪᴘᴘᴇᴅ!'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

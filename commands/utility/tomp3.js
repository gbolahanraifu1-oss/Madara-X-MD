'use strict';
const {downloadMediaMessage}=require('@itsliaaa/baileys');
const {toAudio}=require('../../lib/converter');
module.exports={name:'tomp3',aliases:['toaudio','mp3'],category:'utility',desc:'ᴄᴏɴᴠᴇʀᴛ ᴠɪᴅᴇᴏ ᴛᴏ ᴍᴘ3',usage:'†tomp3 (reply to video)',
async execute(sock,msg,args,ctx){
const s=ctx.settings,quoted=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const vidMsg=quoted?.videoMessage||msg.message?.videoMessage;
if(!vidMsg)return ctx.reply(`❌ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴠɪᴅᴇᴏ.${s.FOOTER}`);
await ctx.react('⏳');
try{const target=quoted?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:quoted}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const audio=await toAudio(buf,'mp4');
await sock.sendMessage(ctx.from,{audio,mimetype:'audio/mpeg',fileName:'audio.mp3'},{quoted:msg});
}catch(e){await ctx.reply(`❌ ${e.message}${s.FOOTER}`);}}};

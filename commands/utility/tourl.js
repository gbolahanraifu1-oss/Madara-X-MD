'use strict';
const axios=require('axios');
module.exports={name:'tourl',aliases:['uploadmedia','imgurl'],category:'utility',desc:'ᴜᴘʟᴏᴀᴅ ᴍᴇᴅɪᴀ ᴀɴᴅ ɢᴇᴛ ᴜʀʟ',usage:'†tourl (reply to media)',
async execute(sock,msg,args,ctx){
const s=ctx.settings,quoted=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
const media=quoted?.imageMessage||quoted?.videoMessage||msg.message?.imageMessage||msg.message?.videoMessage;
if(!media)return ctx.reply(`❌ ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ ᴏʀ ᴠɪᴅᴇᴏ.${s.FOOTER}`);
await ctx.react('⏳');
try{const {downloadMediaMessage}=require('@itsliaaa/baileys');
const target=quoted?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:quoted}:msg;
const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
const form=new(require('form-data'))();
form.append('file',buf,{filename:'upload.jpg',contentType:'image/jpeg'});
const res=await axios.post('https://telegra.ph/upload',form,{headers:form.getHeaders()});
const url=`https://telegra.ph${res.data?.[0]?.src}`;
await ctx.reply(`🔗 *ᴜʀʟ:*\n${url}${s.FOOTER}`);
}catch(e){await ctx.reply(`❌ ${e.message}${s.FOOTER}`);}}};

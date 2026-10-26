'use strict';
const axios=require('axios');
const {downloadMediaMessage}=require('@itsliaaa/baileys');
module.exports = {
    name:'removebg',aliases:['rmbg','bgremove','nobg'],category:'ai',desc:'ʀᴇᴍᴏᴠᴇ ɪᴍᴀɢᴇ ʙᴀᴄᴋɢʀᴏᴜɴᴅ',usage:'†removebg (reply to image)',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings;
        const quoted=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imgMsg=quoted?.imageMessage||msg.message?.imageMessage;
        if(!imgMsg)return ctx.reply(`❌ ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ.${s.FOOTER}`);
        await ctx.react('⏳');
        try{
            const target=quoted?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:quoted}:msg;
            const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
            const form=new(require('form-data'))();
            form.append('image_file',buf,{filename:'img.jpg',contentType:'image/jpeg'});
            form.append('size','auto');
            const res=await axios.post('https://api.remove.bg/v1.0/removebg',form,{
                headers:{...form.getHeaders(),'X-Api-Key':process.env.REMOVEBG_KEY||'SN5r3ZMFnBVApPe6Vr6akN8G'},
                responseType:'arraybuffer'
            });
            await sock.sendMessage(ctx.from,{image:Buffer.from(res.data),mimetype:'image/png',caption:`✂️ ʙɢ ʀᴇᴍᴏᴠᴇᴅ!${s.FOOTER}`},{quoted:msg});
        }catch(e){await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`);}
    }
};

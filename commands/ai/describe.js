'use strict';
module.exports={name:'describe',aliases:['whatisthis', 'imgdesc', 'vision'],category:'ai',desc:'ᴅᴇsᴄʀɪʙᴇ ᴀɴ ɪᴍᴀɢᴇ ᴡɪᴛʜ ᴀɪ',usage:'†describe (reply to image)',
async execute(sock,msg,args,ctx){const s=ctx.settings;
        const quoted=msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imgMsg=quoted?.imageMessage||msg.message?.imageMessage;
        if(!imgMsg)return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ.'+s.FOOTER);
        await ctx.react('⏳');
        try{const {downloadMediaMessage}=require('@itsliaaa/baileys');
        const target=quoted?{key:{remoteJid:ctx.from,id:msg.message.extendedTextMessage.contextInfo.stanzaId},message:quoted}:msg;
        const buf=await downloadMediaMessage(target,'buffer',{},{reuploadRequest:sock.updateMediaMessage});
        const form=new(require('form-data'))();form.append('image',buf,{filename:'img.jpg',contentType:'image/jpeg'});
        const r=await require('axios').post('https://api.deepai.org/api/nsfw-detector',form,{headers:{...form.getHeaders(),'api-key':'quickstart-QUdJIGlzIGNvbWluZy4uLi4K'}});
        await ctx.reply('👁️ *ɪᴍᴀɢᴇ ᴅᴇsᴄʀɪᴘᴛɪᴏɴ:*\n\n'+(r.data?.output||'ᴄᴏᴜʟᴅɴ\'ᴛ ᴅᴇsᴄʀɪʙᴇ')+s.FOOTER);
        }catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

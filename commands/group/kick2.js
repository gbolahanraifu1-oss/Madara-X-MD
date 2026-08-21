'use strict';
module.exports={name:'kick2',aliases:['gkick','remove'],category:'group',desc:'ᴋɪᴄᴋ ᴀ ᴍᴇᴍʙᴇʀ',usage:'†kick2 @user',groupOnly:true,adminOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
const jid=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
if(!jid)return ctx.reply('❌ ᴍᴇɴᴛɪᴏɴ ᴀ ᴜsᴇʀ.'+s.FOOTER);
if(!ctx.isBotAdmin)return ctx.reply('❌ ɪ ɴᴇᴇᴅ ᴀᴅᴍɪɴ ʀɪɢʜᴛs.'+s.FOOTER);
await sock.groupParticipantsUpdate(ctx.from,[jid],'remove');
await ctx.reply('✅ *@'+jid.split('@')[0]+'* ʜᴀs ʙᴇᴇɴ ᴋɪᴄᴋᴇᴅ.'+s.FOOTER);}};

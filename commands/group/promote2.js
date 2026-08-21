'use strict';
module.exports={name:'promote2',aliases:['admin','makeadmin'],category:'group',desc:'ᴘʀᴏᴍᴏᴛᴇ ᴛᴏ ᴀᴅᴍɪɴ',usage:'†promote2 @user',groupOnly:true,adminOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
const jid=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
if(!jid)return ctx.reply('❌ ᴍᴇɴᴛɪᴏɴ ᴀ ᴜsᴇʀ.'+s.FOOTER);
await sock.groupParticipantsUpdate(ctx.from,[jid],'promote');
await ctx.reply('⬆️ *@'+jid.split('@')[0]+'* ᴘʀᴏᴍᴏᴛᴇᴅ ᴛᴏ ᴀᴅᴍɪɴ.'+s.FOOTER);}};

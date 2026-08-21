'use strict';
module.exports={name:'demote2',aliases:['unadmin','removeadmin'],category:'group',desc:'ᴅᴇᴍᴏᴛᴇ ᴀᴅᴍɪɴ',usage:'†demote2 @user',groupOnly:true,adminOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
const jid=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
if(!jid)return ctx.reply('❌ ᴍᴇɴᴛɪᴏɴ ᴀ ᴜsᴇʀ.'+s.FOOTER);
await sock.groupParticipantsUpdate(ctx.from,[jid],'demote');
await ctx.reply('⬇️ *@'+jid.split('@')[0]+'* ᴅᴇᴍᴏᴛᴇᴅ.'+s.FOOTER);}};

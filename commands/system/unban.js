'use strict';
module.exports={name:'unban',aliases:['unbanuser','whitelist'],category:'system',desc:'ᴜɴʙᴀɴ ᴜsᴇʀ',usage:'†unban @user',
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isOwner)return ctx.reply('⛔ ᴏᴡɴᴇʀ ᴏɴʟʏ.'+s.FOOTER);
const jid=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
if(!jid)return ctx.reply('❌ ᴍᴇɴᴛɪᴏɴ ᴀ ᴜsᴇʀ.'+s.FOOTER);
if(global._bannedUsers)global._bannedUsers.delete(jid.split('@')[0]);
await ctx.reply('✅ *@'+jid.split('@')[0]+'* ᴜɴʙᴀɴɴᴇᴅ.'+s.FOOTER);}};

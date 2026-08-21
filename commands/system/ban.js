'use strict';
module.exports={name:'ban',aliases:['banuser','blacklist'],category:'system',desc:'ʙᴀɴ ᴜsᴇʀ ғʀᴏᴍ ʙᴏᴛ',usage:'†ban @user',
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isOwner)return ctx.reply('⛔ ᴏᴡɴᴇʀ ᴏɴʟʏ.'+s.FOOTER);
const jid=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
if(!jid)return ctx.reply('❌ ᴍᴇɴᴛɪᴏɴ ᴀ ᴜsᴇʀ.'+s.FOOTER);
if(!global._bannedUsers)global._bannedUsers=new Set();
global._bannedUsers.add(jid.split('@')[0]);
await ctx.reply('🚫 *@'+jid.split('@')[0]+'* ʙᴀɴɴᴇᴅ ғʀᴏᴍ ᴜsɪɴɢ ᴛʜᴇ ʙᴏᴛ.'+s.FOOTER);}};

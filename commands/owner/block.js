'use strict';
module.exports={name:'block',aliases:['blockuser','blocknumber'],category:'owner',desc:'ʙʟᴏᴄᴋ ᴀ ᴜsᴇʀ',usage:'†block @user',ownerOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isOwner)return ctx.reply('⛔ ᴏᴡɴᴇʀ ᴏɴʟʏ.'+s.FOOTER);
const jid=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
if(!jid)return ctx.reply('❌ ᴍᴇɴᴛɪᴏɴ ᴀ ᴜsᴇʀ.'+s.FOOTER);
await sock.updateBlockStatus(jid,'block');
await ctx.reply('🚫 *@'+jid.split('@')[0]+'* ʙʟᴏᴄᴋᴇᴅ.'+s.FOOTER);}};

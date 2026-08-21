'use strict';
module.exports={name:'unblock',aliases:['unblockuser','unblock2'],category:'owner',desc:'ᴜɴʙʟᴏᴄᴋ ᴀ ᴜsᴇʀ',usage:'†unblock @user',ownerOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isOwner)return ctx.reply('⛔ ᴏᴡɴᴇʀ ᴏɴʟʏ.'+s.FOOTER);
const jid=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]||(args[0]?.replace(/[^0-9]/g,'')+'@s.whatsapp.net');
if(!jid)return ctx.reply('❌ ᴍᴇɴᴛɪᴏɴ ᴀ ᴜsᴇʀ.'+s.FOOTER);
await sock.updateBlockStatus(jid,'unblock');
await ctx.reply('✅ *@'+jid.split('@')[0]+'* ᴜɴʙʟᴏᴄᴋᴇᴅ.'+s.FOOTER);}};

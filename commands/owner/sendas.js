'use strict';
module.exports={name:'sendas',aliases:['sendmessage','msgas'],category:'owner',desc:'sᴇɴᴅ ᴍᴇssᴀɢᴇ ᴀs ʙᴏᴛ',usage:'†sendas <jid> <message>',ownerOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isDevOwner)return ctx.reply('⛔ *ᴅᴇᴠ ᴏɴʟʏ.*'+s.FOOTER);
const jid=args[0]?.replace(/[^0-9]/g,'')+'@s.whatsapp.net';
const text=args.slice(1).join(' ');
if(!jid||!text)return ctx.reply('❌ '+s.prefix+'sendas 234xxx message'+s.FOOTER);
await sock.sendMessage(jid,{text});
await ctx.reply('✅ sᴇɴᴛ!'+s.FOOTER);}};

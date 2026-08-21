'use strict';
module.exports={name:'setmode',aliases:['botmode','setpublic','setprivate'],category:'owner',desc:'sᴇᴛ ᴘᴜʙʟɪᴄ/ᴘʀɪᴠᴀᴛᴇ ᴍᴏᴅᴇ',usage:'†setmode public/private',ownerOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isDevOwner)return ctx.reply('⛔ *ᴅᴇᴠ ᴏɴʟʏ.*'+s.FOOTER);
const mode=(args[0]||'public').toLowerCase();
if(!['public','private','inbox'].includes(mode))return ctx.reply('❌ ᴜsᴇ: public/private/inbox'+s.FOOTER);
s.commandMode=mode;process.env.COMMAND_MODE=mode;
await ctx.reply('✅ ᴍᴏᴅᴇ: *'+mode+'*'+s.FOOTER);}};

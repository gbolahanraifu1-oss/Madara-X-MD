'use strict';
module.exports={name:'join',aliases:['joinchat','invitelink'],category:'owner',desc:'ᴊᴏɪɴ ᴀ ɢʀᴏᴜᴘ ᴠɪᴀ ʟɪɴᴋ',usage:'†join <invite link>',ownerOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isOwner)return ctx.reply('⛔ ᴏᴡɴᴇʀ ᴏɴʟʏ.'+s.FOOTER);
const link=args[0];if(!link)return ctx.reply('❌ ᴘʀᴏᴠɪᴅᴇ ɪɴᴠɪᴛᴇ ʟɪɴᴋ.'+s.FOOTER);
const code=link.split('chat.whatsapp.com/').pop().split('?')[0];
try{await sock.groupAcceptInvite(code);await ctx.reply('✅ ᴊᴏɪɴᴇᴅ ɢʀᴏᴜᴘ!'+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

'use strict';
module.exports={name:'revoke',aliases:['resetlink','newlink'],category:'group',desc:'ʀᴇsᴇᴛ ɢʀᴏᴜᴘ ɪɴᴠɪᴛᴇ ʟɪɴᴋ',usage:'†revoke',groupOnly:true,adminOnly:true,
async execute(sock,msg,args,ctx){
const s=ctx.settings;
const code=await sock.groupRevokeInvite(ctx.from);
await ctx.reply(`🔗 *ɴᴇᴡ ɪɴᴠɪᴛᴇ ʟɪɴᴋ:*\nhttps://chat.whatsapp.com/${code}${s.FOOTER}`);}};

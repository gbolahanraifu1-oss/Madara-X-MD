'use strict';
module.exports={name:'subject',aliases:['setname','groupname','rename'],category:'group',desc:'ᴄʜᴀɴɢᴇ ɢʀᴏᴜᴘ ɴᴀᴍᴇ',usage:'†subject <name>',groupOnly:true,adminOnly:true,
async execute(sock,msg,args,ctx){
const s=ctx.settings,name=args.join(' ');
if(!name)return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}subject New Name${s.FOOTER}`);
await sock.groupUpdateSubject(ctx.from,name);
await ctx.reply(`✅ ɢʀᴏᴜᴘ ɴᴀᴍᴇ ᴄʜᴀɴɢᴇᴅ ᴛᴏ *${name}*${s.FOOTER}`);}};

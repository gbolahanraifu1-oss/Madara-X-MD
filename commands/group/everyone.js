'use strict';
module.exports={name:'everyone',aliases:['all','ping3'],category:'group',desc:'ᴍᴇɴᴛɪᴏɴ ᴇᴠᴇʀʏᴏɴᴇ ᴡɪᴛʜ ᴛᴇxᴛ',usage:'†everyone <message>',groupOnly:true,adminOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
const meta=await sock.groupMetadata(ctx.from).catch(()=>null);
if(!meta)return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ.'+s.FOOTER);
const members=meta.participants.map(p=>p.id);
const text=args.join(' ')||'📢 ᴀᴛᴛᴇɴᴛɪᴏɴ ᴇᴠᴇʀʏᴏɴᴇ!';
await sock.sendMessage(ctx.from,{text,mentions:members},{quoted:msg});}};

'use strict';
module.exports={name:'poll',aliases:['vote','createpoll'],category:'group',desc:'ᴄʀᴇᴀᴛᴇ ᴀ ᴘᴏʟʟ',usage:'†poll Question | Option1 | Option2',groupOnly:true,
async execute(sock,msg,args,ctx){
const s=ctx.settings,text=args.join(' ');
const parts=text.split('|').map(p=>p.trim());
if(parts.length<3)return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}poll Best anime? | Naruto | One Piece | DBZ${s.FOOTER}`);
const [name,...values]=parts;
await sock.sendMessage(ctx.from,{poll:{name,values,selectableCount:1}},{quoted:msg});}};

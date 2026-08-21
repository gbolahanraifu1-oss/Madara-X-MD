'use strict';
const axios=require('axios');
module.exports={name:'poll2',aliases:['quickpoll','vote2'],category:'misc',desc:'ᴄʀᴇᴀᴛᴇ ᴀ ǫᴜɪᴄᴋ ᴘᴏʟʟ',usage:'†poll2 Q|A|B|C',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const parts=args.join(' ').split('|').map(p=>p.trim());
if(parts.length<3)return ctx.reply('❌ *ᴜsᴀɢᴇ:* '+s.prefix+'poll2 Q|A|B|C'+s.FOOTER);
const[name,...values]=parts;
await sock.sendMessage(ctx.from,{poll:{name,values,selectableCount:1}},{quoted:msg});}};

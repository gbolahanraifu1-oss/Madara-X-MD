'use strict';
module.exports={name:'tagowner',aliases:['callowner','ownerping'],category:'system',desc:'ᴛᴀɢ ᴛʜᴇ ʙᴏᴛ ᴏᴡɴᴇʀ',usage:'†tagowner',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const ownerJid=s.ownerNumber.replace(/[^0-9]/g,'')+'@s.whatsapp.net';
await sock.sendMessage(ctx.from,{text:'👑 *ʙᴏᴛ ᴏᴡɴᴇʀ:* @'+s.ownerNumber.replace(/[^0-9]/g,''),mentions:[ownerJid]},{quoted:msg});}};

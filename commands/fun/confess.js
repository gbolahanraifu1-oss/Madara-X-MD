'use strict';
module.exports={name:'confess',aliases:['confession','anonymous'],category:'fun',desc:'sᴇɴᴅ ᴀɴᴏɴ ᴄᴏɴғᴇssɪᴏɴ',usage:'†confess <message>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const text=args.join(' ');if(!text)return ctx.reply('❌ '+s.prefix+'confess I like someone in this group'+s.FOOTER);
await sock.sendMessage(ctx.from,{text:'🤫 *ᴀɴᴏɴʏᴍᴏᴜs ᴄᴏɴғᴇssɪᴏɴ*\n\n'+text+s.FOOTER},{quoted:msg});}};

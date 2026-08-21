'use strict';
module.exports={name:'clonebot',aliases:['copysession','sessinfo'],category:'owner',desc:'sʜᴏᴡ sᴇssɪᴏɴ sᴜᴍᴍᴀʀʏ',usage:'†clonebot',ownerOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isDevOwner)return ctx.reply('⛔ *ᴅᴇᴠ ᴏɴʟʏ.*'+s.FOOTER);
const{activeSessions}=require('../../lib/pairManager');
const connected=[...activeSessions.entries()].filter(([,s2])=>s2.connected).map(([p])=>'+'+p);
await ctx.reply('📊 *sᴇssɪᴏɴ sᴜᴍᴍᴀʀʏ*\n\n✅ ᴄᴏɴɴᴇᴄᴛᴇᴅ: '+connected.length+'\n\n'+connected.join('\n')+s.FOOTER);}};

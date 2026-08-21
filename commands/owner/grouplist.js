'use strict';
module.exports={name:'grouplist',aliases:['listgroups','mygroups'],category:'owner',desc:'ʟɪsᴛ ᴀʟʟ ɢʀᴏᴜᴘs',usage:'†grouplist',ownerOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!ctx.isOwner)return ctx.reply('⛔ ᴏᴡɴᴇʀ ᴏɴʟʏ.'+s.FOOTER);
try{const groups=await sock.groupFetchAllParticipating();
const list=Object.values(groups).map(g=>g.subject).join('\n');
await ctx.reply('👥 *ɢʀᴏᴜᴘs:*\n\n'+list+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

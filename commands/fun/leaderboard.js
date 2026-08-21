'use strict';
module.exports={name:'leaderboard',aliases:['lb','top','richest'],category:'fun',desc:'sʜᴏᴡ ʀɪᴄʜᴇsᴛ ᴜsᴇʀs',usage:'†leaderboard',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,db=require('../../lib/database');
        const users=db.getAllUsers?.()??{};
        const sorted=Object.entries(users).sort((a,b)=>((b[1].balance||0)+(b[1].bank||0))-((a[1].balance||0)+(a[1].bank||0))).slice(0,10);
        if(!sorted.length)return ctx.reply(`📊 ɴᴏ ᴅᴀᴛᴀ ʏᴇᴛ.${s.FOOTER}`);
        const lines=sorted.map(([k,v],i)=>`${['🥇','🥈','🥉'][i]||`${i+1}.`} +${k}: *${(v.balance||0)+(v.bank||0)}* ᴄᴏɪɴs`).join('\n');
        await ctx.reply(`🏆 *ʟᴇᴀᴅᴇʀʙᴏᴀʀᴅ*\n\n${lines}${s.FOOTER}`);}};

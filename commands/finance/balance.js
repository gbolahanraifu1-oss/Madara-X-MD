'use strict';
module.exports = {
    name:'balance',aliases:['bal','coins','wallet'],category:'finance',desc:'ᴄʜᴇᴄᴋ ʏᴏᴜʀ ʙᴀʟᴀɴᴄᴇ',usage:'†balance',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,db=require('../../lib/database'),num=ctx.sender.split('@')[0];
        const bal=db.getUser(num,'balance')||0,bank=db.getUser(num,'bank')||0;
        await ctx.reply(`💰 *ᴡᴀʟʟᴇᴛ*\n\n🪙 ᴄᴀsʜ: *${bal}*\n🏦 ʙᴀɴᴋ: *${bank}*\n💎 ᴛᴏᴛᴀʟ: *${bal+bank}*${s.FOOTER}`);
    }
};

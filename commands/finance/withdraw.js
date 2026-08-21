'use strict';
module.exports = {
    name:'withdraw',aliases:['with','wd'],category:'finance',desc:'ᴡɪᴛʜᴅʀᴀᴡ ғʀᴏᴍ ʙᴀɴᴋ',usage:'†withdraw <amount>',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,db=require('../../lib/database'),num=ctx.sender.split('@')[0];
        const amt=parseInt(args[0]);
        if(!amt||amt<1)return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}withdraw 100${s.FOOTER}`);
        const bank=db.getUser(num,'bank')||0;
        if(bank<amt)return ctx.reply(`❌ ʙᴀɴᴋ ʜᴀs *${bank}*.${s.FOOTER}`);
        db.setUser(num,'bank',bank-amt);
        db.setUser(num,'balance',(db.getUser(num,'balance')||0)+amt);
        await ctx.reply(`💸 ᴡɪᴛʜᴅʀᴀᴡɴ *${amt}* ᴄᴏɪɴs.${s.FOOTER}`);
    }
};

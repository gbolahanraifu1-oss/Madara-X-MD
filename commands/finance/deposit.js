'use strict';
module.exports = {
    name:'deposit',aliases:['dep','bank'],category:'finance',desc:'ᴅᴇᴘᴏsɪᴛ ᴄᴏɪɴs ᴛᴏ ʙᴀɴᴋ',usage:'†deposit <amount>',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,db=require('../../lib/database'),num=ctx.sender.split('@')[0];
        const amt=parseInt(args[0]);
        if(!amt||amt<1)return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}deposit 100${s.FOOTER}`);
        const bal=db.getUser(num,'balance')||0;
        if(bal<amt)return ctx.reply(`❌ ɪɴsᴜғғɪᴄɪᴇɴᴛ ʙᴀʟᴀɴᴄᴇ. ʏᴏᴜ ʜᴀᴠᴇ *${bal}*${s.FOOTER}`);
        db.setUser(num,'balance',bal-amt);
        db.setUser(num,'bank',(db.getUser(num,'bank')||0)+amt);
        await ctx.reply(`🏦 ᴅᴇᴘᴏsɪᴛᴇᴅ *${amt}* ᴄᴏɪɴs ᴛᴏ ʙᴀɴᴋ.${s.FOOTER}`);
    }
};

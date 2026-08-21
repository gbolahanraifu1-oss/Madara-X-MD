'use strict';
module.exports = {
    name:'transfer',aliases:['give','send'],category:'finance',desc:'ᴛʀᴀɴsғᴇʀ ᴄᴏɪɴs',usage:'†transfer @user <amount>',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,db=require('../../lib/database');
        const mentioned=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const amt=parseInt(args.find(a=>!isNaN(parseInt(a))));
        if(!mentioned||!amt)return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}transfer @user 100${s.FOOTER}`);
        const from=ctx.sender.split('@')[0],to=mentioned.split('@')[0];
        const bal=db.getUser(from,'balance')||0;
        if(bal<amt)return ctx.reply(`❌ ɪɴsᴜғғɪᴄɪᴇɴᴛ ʙᴀʟᴀɴᴄᴇ.${s.FOOTER}`);
        db.setUser(from,'balance',bal-amt);
        db.setUser(to,'balance',(db.getUser(to,'balance')||0)+amt);
        await ctx.reply(`💸 ᴛʀᴀɴsғᴇʀʀᴇᴅ *${amt}* ᴛᴏ @${to}${s.FOOTER}`);
    }
};

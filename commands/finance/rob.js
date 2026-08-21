'use strict';
module.exports = {
    name:'rob',aliases:['steal','heist'],category:'finance',desc:'ʀᴏʙ ᴀɴᴏᴛʜᴇʀ ᴜsᴇʀ',usage:'†rob @user',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,db=require('../../lib/database');
        const mentioned=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if(!mentioned)return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}rob @user${s.FOOTER}`);
        const from=ctx.sender.split('@')[0],to=mentioned.split('@')[0];
        if(from===to)return ctx.reply(`❌ ʏᴏᴜ ᴄᴀɴ'ᴛ ʀᴏʙ ʏᴏᴜʀsᴇʟғ.${s.FOOTER}`);
        const tobal=db.getUser(to,'balance')||0;
        if(tobal<100)return ctx.reply(`❌ *@${to}* ɪs ᴛᴏᴏ ᴘᴏᴏʀ ᴛᴏ ʀᴏʙ.${s.FOOTER}`);
        const success=Math.random()>0.4;
        if(success){
            const amt=Math.floor(Math.random()*tobal*0.3)+1;
            db.setUser(to,'balance',tobal-amt);
            db.setUser(from,'balance',(db.getUser(from,'balance')||0)+amt);
            await ctx.reply(`🦹 sᴜᴄᴄᴇss! ʏᴏᴜ sᴛᴏʟᴇ *${amt}* ᴄᴏɪɴs ғʀᴏᴍ @${to}!${s.FOOTER}`);
        }else{
            const fine=Math.floor(Math.random()*200)+50;
            db.setUser(from,'balance',Math.max(0,(db.getUser(from,'balance')||0)-fine));
            await ctx.reply(`🚔 ʏᴏᴜ ɢᴏᴛ ᴄᴀᴜɢʜᴛ! *-${fine}* ᴄᴏɪɴs ғɪɴᴇ.${s.FOOTER}`);
        }
    }
};

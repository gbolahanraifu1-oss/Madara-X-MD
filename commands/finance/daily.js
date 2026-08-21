'use strict';
module.exports = {
    name:'daily',aliases:['claim','dailycoins'],category:'finance',desc:'ᴄʟᴀɪᴍ ᴅᴀɪʟʏ ᴄᴏɪɴs',usage:'†daily',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,db=require('../../lib/database'),num=ctx.sender.split('@')[0];
        const last=db.getUser(num,'lastDaily')||0,now=Date.now(),cd=24*60*60*1000;
        if(now-last<cd){const left=cd-(now-last);const h=Math.floor(left/3600000),m=Math.floor((left%3600000)/60000);return ctx.reply(`⏳ ᴄᴏᴍᴇ ʙᴀᴄᴋ ɪɴ *${h}ʜ ${m}ᴍ*${s.FOOTER}`);}
        const reward=Math.floor(Math.random()*500)+500;
        db.setUser(num,'balance',(db.getUser(num,'balance')||0)+reward);
        db.setUser(num,'lastDaily',now);
        await ctx.reply(`🎁 *ᴅᴀɪʟʏ ʀᴇᴡᴀʀᴅ!*\n\n🪙 +*${reward}* ᴄᴏɪɴs ᴀᴅᴅᴇᴅ!${s.FOOTER}`);
    }
};

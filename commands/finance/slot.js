'use strict';
module.exports = {
    name:'slot',aliases:['slots','gamble'],category:'finance',desc:'ᴘʟᴀʏ sʟᴏᴛs',usage:'†slot <bet>',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,db=require('../../lib/database'),num=ctx.sender.split('@')[0];
        const bet=parseInt(args[0]);
        if(!bet||bet<10)return ctx.reply(`❌ ᴍɪɴ ʙᴇᴛ: 10. *ᴜsᴀɢᴇ:* ${s.prefix}slot 100${s.FOOTER}`);
        const bal=db.getUser(num,'balance')||0;
        if(bal<bet)return ctx.reply(`❌ ɪɴsᴜғғɪᴄɪᴇɴᴛ ʙᴀʟᴀɴᴄᴇ.${s.FOOTER}`);
        const items=['🍒','🍋','🍊','🍇','🔔','⭐','💎'];
        const spin=()=>items[Math.floor(Math.random()*items.length)];
        const r=[spin(),spin(),spin()];
        const all3=r[0]===r[1]&&r[1]===r[2];
        const two=r[0]===r[1]||r[1]===r[2]||r[0]===r[2];
        const mult=all3?10:two?2:0;
        const result=mult>0?bet*mult:bet;
        db.setUser(num,'balance',mult>0?bal+result-bet:bal-result);
        await ctx.reply(`🎰 *sʟᴏᴛ ᴍᴀᴄʜɪɴᴇ*\n\n[ ${r.join(' | ')} ]\n\n${all3?`🎉 *ᴊᴀᴄᴋᴘᴏᴛ!* +${result-bet}`:two?`✅ *ᴡɪɴ!* +${result-bet}`:`❌ *ʟᴏss* -${bet}`}${s.FOOTER}`);
    }
};

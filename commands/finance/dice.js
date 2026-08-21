'use strict';
module.exports={name:'dice',aliases:['rolldice','dicebet'],category:'finance',desc:'ʙᴇᴛ ᴏɴ ᴀ ᴅɪᴄᴇ ʀᴏʟʟ',usage:'†dice <number 1-6> <bet>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const db=require('../../lib/database'),num=ctx.sender.split('@')[0];
const pick=parseInt(args[0]),bet=parseInt(args[1]);
if(!pick||pick<1||pick>6||!bet)return ctx.reply('❌ *ᴜsᴀɢᴇ:* '+s.prefix+'dice 4 100'+s.FOOTER);
const bal=db.getUser(num,'balance')||0;
if(bal<bet)return ctx.reply('❌ ɪɴsᴜғғɪᴄɪᴇɴᴛ ʙᴀʟᴀɴᴄᴇ.'+s.FOOTER);
const roll=Math.floor(Math.random()*6)+1,win=roll===pick;
db.setUser(num,'balance',win?bal+(bet*5):bal-bet);
await ctx.reply('🎲 ʀᴏʟʟᴇᴅ: *'+roll+'*\n\n'+(win?'🎉 ʏᴏᴜ ɢᴜᴇssᴇᴅ ɪᴛ! *+'+bet*5+'*!':'❌ ʙᴇᴛᴛᴇʀ ʟᴜᴄᴋ! *-'+bet+'*.')+s.FOOTER);}};

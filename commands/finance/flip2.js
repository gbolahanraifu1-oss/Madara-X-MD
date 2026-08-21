'use strict';
module.exports={name:'flip2',aliases:['betflip','coinbet'],category:'finance',desc:'ʙᴇᴛ ᴏɴ ᴀ ᴄᴏɪɴ ғʟɪᴘ',usage:'†flip2 <heads/tails> <bet>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const db=require('../../lib/database'),num=ctx.sender.split('@')[0];
const side=(args[0]||'').toLowerCase(),bet=parseInt(args[1]);
if(!['heads','tails'].includes(side)||!bet)return ctx.reply('❌ *ᴜsᴀɢᴇ:* '+s.prefix+'flip2 heads 100'+s.FOOTER);
const bal=db.getUser(num,'balance')||0;
if(bal<bet)return ctx.reply('❌ ɪɴsᴜғғɪᴄɪᴇɴᴛ ʙᴀʟᴀɴᴄᴇ.'+s.FOOTER);
const result=Math.random()<.5?'heads':'tails',win=result===side;
db.setUser(num,'balance',win?bal+bet:bal-bet);
await ctx.reply('🪙 *'+result.toUpperCase()+'*\n\n'+(win?'🎉 ʏᴏᴜ ᴡᴏɴ *+'+bet+'*!':'💸 ʏᴏᴜ ʟᴏsᴛ *-'+bet+'*.'+s.FOOTER));}};

'use strict';
module.exports={name:'weekly',aliases:['weeklyclaim','wclaim'],category:'finance',desc:'ᴄʟᴀɪᴍ ᴡᴇᴇᴋʟʏ ʙᴏɴᴜs',usage:'†weekly',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const db=require('../../lib/database'),num=ctx.sender.split('@')[0];
const last=db.getUser(num,'lastWeekly')||0,cd=7*24*60*60*1000,now=Date.now();
if(now-last<cd)return ctx.reply('📅 ᴄᴏᴍᴇ ʙᴀᴄᴋ ɪɴ *'+Math.floor((cd-(now-last))/86400000)+'ᴅ*.'+s.FOOTER);
const earn=Math.floor(Math.random()*3000)+2000;
db.setUser(num,'balance',(db.getUser(num,'balance')||0)+earn);
db.setUser(num,'lastWeekly',now);
await ctx.reply('🎁 *ᴡᴇᴇᴋʟʏ ʙᴏɴᴜs!* +*'+earn+' ᴄᴏɪɴs*'+s.FOOTER);}};

'use strict';
module.exports={name:'mine',aliases:['work2','mine2'],category:'finance',desc:'ᴍɪɴᴇ ᴄᴏɪɴs',usage:'†mine',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const db=require('../../lib/database'),num=ctx.sender.split('@')[0];
const last=db.getUser(num,'lastMine')||0,cd=30*60*1000,now=Date.now();
if(now-last<cd)return ctx.reply('⛏️ ᴍɪɴᴇ ᴄᴏᴏʟᴅᴏᴡɴ: *'+Math.round((cd-(now-last))/60000)+'ᴍ* ʟᴇғᴛ.'+s.FOOTER);
const earn=Math.floor(Math.random()*200)+50;
db.setUser(num,'balance',(db.getUser(num,'balance')||0)+earn);
db.setUser(num,'lastMine',now);
await ctx.reply('⛏️ ʏᴏᴜ ᴍɪɴᴇᴅ *'+earn+' ᴄᴏɪɴs*!'+s.FOOTER);}};

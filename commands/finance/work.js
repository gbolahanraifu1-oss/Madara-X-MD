'use strict';
module.exports={name:'work',aliases:['job','earn'],category:'finance',desc:'ᴡᴏʀᴋ ᴛᴏ ᴇᴀʀɴ ᴄᴏɪɴs',usage:'†work',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const db=require('../../lib/database'),num=ctx.sender.split('@')[0];
const last=db.getUser(num,'lastWork')||0,cd=60*60*1000,now=Date.now();
if(now-last<cd)return ctx.reply('💼 ᴡᴏʀᴋ ᴄᴏᴏʟᴅᴏᴡɴ: *'+Math.round((cd-(now-last))/60000)+'ᴍ* ʟᴇғᴛ.'+s.FOOTER);
const jobs=['ᴘʀᴏɢʀᴀᴍᴍᴇᴅ ᴀ ʙᴏᴛ','ᴅᴇʟɪᴠᴇʀᴇᴅ ᴘᴀᴄᴋᴀɢᴇs','sᴏʟᴅ ɢᴀᴍɪɴɢ ᴀᴄᴄᴏᴜɴᴛs','ᴅᴇsɪɢɴᴇᴅ ᴀ ʟᴏɢᴏ','ᴛᴀᴜɢʜᴛ ᴀ ᴄʟᴀss'];
const earn=Math.floor(Math.random()*500)+200;
db.setUser(num,'balance',(db.getUser(num,'balance')||0)+earn);
db.setUser(num,'lastWork',now);
await ctx.reply('💼 ʏᴏᴜ '+jobs[Math.floor(Math.random()*jobs.length)]+' ᴀɴᴅ ᴇᴀʀɴᴇᴅ *'+earn+' ᴄᴏɪɴs*!'+s.FOOTER);}};

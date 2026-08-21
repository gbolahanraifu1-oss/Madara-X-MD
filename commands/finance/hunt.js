'use strict';
module.exports={name:'hunt',aliases:['hunting','hunt2'],category:'finance',desc:'ɢᴏ ʜᴜɴᴛɪɴɢ',usage:'†hunt',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const db=require('../../lib/database'),num=ctx.sender.split('@')[0];
const last=db.getUser(num,'lastHunt')||0,cd=45*60*1000,now=Date.now();
if(now-last<cd)return ctx.reply('🏹 ᴡᴀɪᴛ *'+Math.round((cd-(now-last))/60000)+'ᴍ*.'+s.FOOTER);
const preys=['🦊 ғᴏx (+400)','🐗 ʙᴏᴀʀ (+600)','🦌 ᴅᴇᴇʀ (+300)','🐇 ʀᴀʙʙɪᴛ (+100)','💨 ᴍɪssᴇᴅ (0)'];
const vals=[400,600,300,100,0];
const idx=Math.floor(Math.random()*preys.length);
db.setUser(num,'balance',(db.getUser(num,'balance')||0)+vals[idx]);
db.setUser(num,'lastHunt',now);
await ctx.reply('🏹 ʏᴏᴜ ʜᴜɴᴛᴇᴅ: *'+preys[idx]+'*'+s.FOOTER);}};

'use strict';
module.exports={name:'fish',aliases:['fishing','catchfish'],category:'finance',desc:'ɢᴏ ғɪsʜɪɴɢ ғᴏʀ ᴄᴏɪɴs',usage:'†fish',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const db=require('../../lib/database'),num=ctx.sender.split('@')[0];
const last=db.getUser(num,'lastFish')||0,cd=45*60*1000,now=Date.now();
if(now-last<cd)return ctx.reply('🎣 ᴡᴀɪᴛ *'+Math.round((cd-(now-last))/60000)+'ᴍ* ᴛᴏ ғɪsʜ ᴀɢᴀɪɴ.'+s.FOOTER);
const catches=['🐟 ᴛᴜɴᴀ (+300)','🦈 sʜᴀʀᴋ (+800)','🎣 ʙᴏᴏᴛ (-50)','🐠 ᴄʟᴏᴡɴғɪsʜ (+200)','🦑 sǫᴜɪᴅ (+150)','🪝 ɴᴏᴛʜɪɴɢ (0)'];
const weights=[300,800,-50,200,150,0];
const idx=Math.floor(Math.random()*catches.length);
const earn=weights[idx];
db.setUser(num,'balance',Math.max(0,(db.getUser(num,'balance')||0)+earn));
db.setUser(num,'lastFish',now);
await ctx.reply('🎣 ʏᴏᴜ ᴄᴀᴜɢʜᴛ: *'+catches[idx]+'*'+s.FOOTER);}};

'use strict';
module.exports={name:'profile',aliases:['stats','myprofile'],category:'finance',desc:'ᴠɪᴇᴡ ʏᴏᴜʀ ᴘʀᴏғɪʟᴇ',usage:'†profile',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const db=require('../../lib/database'),num=ctx.sender.split('@')[0];
const bal=db.getUser(num,'balance')||0,bank=db.getUser(num,'bank')||0;
const warns=db.getUser(num,'warns')||0;
await ctx.reply('👤 *'+ctx.pushName+'*\n\n💰 ᴄᴀsʜ: *'+bal+'*\n🏦 ʙᴀɴᴋ: *'+bank+'*\n💎 ᴛᴏᴛᴀʟ: *'+(bal+bank)+'*\n⚠️ ᴡᴀʀɴs: *'+warns+'/3*'+s.FOOTER);}};

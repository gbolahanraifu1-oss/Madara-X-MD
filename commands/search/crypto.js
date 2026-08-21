'use strict';
const axios=require('axios');
module.exports={name:'crypto',aliases:['coin','btc','cryptoprice'],category:'search',desc:'ɢᴇᴛ ᴄʀʏᴘᴛᴏ ᴘʀɪᴄᴇ',usage:'†crypto <coin>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const coin=(args[0]||'bitcoin').toLowerCase();
try{const r=await require('axios').get('https://api.coingecko.com/api/v3/simple/price?ids='+coin+'&vs_currencies=usd&include_24hr_change=true');
const d=r.data[coin];if(!d)throw new Error('ᴄᴏɪɴ ɴᴏᴛ ғᴏᴜɴᴅ');
const change=d.usd_24h_change?.toFixed(2);
await ctx.reply('💰 *'+coin.toUpperCase()+'*\n\n💵 ᴘʀɪᴄᴇ: *$'+d.usd?.toLocaleString()+'*\n📊 24ʜ: '+(change>0?'📈 +'+change:' 📉 '+change)+'%'+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

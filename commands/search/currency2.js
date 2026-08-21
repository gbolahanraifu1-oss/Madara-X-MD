'use strict';
const axios=require('axios');
module.exports={name:'currency2',aliases:['fx','exchangerate'],category:'search',desc:'ʟɪsᴛ ᴛᴏᴘ ᴇxᴄʜᴀɴɢᴇ ʀᴀᴛᴇs',usage:'†currency2 <from>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const from=(args[0]||'USD').toUpperCase();
try{const r=await require('axios').get('https://api.exchangerate-api.com/v4/latest/'+from);
const rates=r.data?.rates;if(!rates)throw new Error();
const top=['NGN','GHS','KES','ZAR','EUR','GBP','JPY','CNY','INR','BRL'];
const lines=top.map(c=>'*'+c+':* '+rates[c]?.toFixed(2)).join('\n');
await ctx.reply('💱 *1 '+from+' =*\n\n'+lines+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

'use strict';
const axios=require('axios');
module.exports={name:'currency',aliases:['convert','forex','cc'],category:'utility',desc:'ᴄᴜʀʀᴇɴᴄʏ ᴄᴏɴᴠᴇʀᴛᴇʀ',usage:'†currency 100 USD NGN',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const [amt,from,to]=[parseFloat(args[0]),args[1]?.toUpperCase(),args[2]?.toUpperCase()];
if(!amt||!from||!to)return ctx.reply('❌ *ᴜsᴀɢᴇ:* '+s.prefix+'currency 100 USD NGN'+s.FOOTER);
try{const r=await require('axios').get('https://api.exchangerate-api.com/v4/latest/'+from);
const rate=r.data?.rates?.[to];if(!rate)throw new Error('ᴄᴜʀʀᴇɴᴄʏ ɴᴏᴛ ғᴏᴜɴᴅ');
await ctx.reply('💱 *'+amt+' '+from+' = '+(amt*rate).toFixed(2)+' '+to+'*'+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

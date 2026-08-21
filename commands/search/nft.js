'use strict';
const axios=require('axios');
module.exports={name:'nft',aliases:['nftinfo','nftsearch'],category:'search',desc:'sᴇᴀʀᴄʜ ɴғᴛ ɪɴғᴏ',usage:'†nft <name>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ')||'bored ape';
try{const r=await require('axios').get('https://api.opensea.io/api/v2/collections?chain=ethereum&limit=3&order_by=seven_day_volume',{headers:{'X-API-KEY':''}});
const cols=r.data?.results?.slice(0,3);if(!cols?.length)throw new Error('ɴᴏ ʀᴇsᴜʟᴛs');
const lines=cols.map(c=>'*'+c.name+'*\n💰 Floor: '+(c.stats?.floor_price||'N/A')+' ETH').join('\n\n');
await ctx.reply('🖼️ *ᴛᴏᴘ ɴғᴛs*\n\n'+lines+s.FOOTER);}
catch{await ctx.reply('❌ ɴғᴛ sᴇᴀʀᴄʜ ᴜɴᴀᴠᴀɪʟᴀʙʟᴇ.'+s.FOOTER);}}};

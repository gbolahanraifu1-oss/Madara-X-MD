'use strict';
module.exports={name:'shop2',aliases:['itemshop','buyitem'],category:'finance',desc:'ʙᴜʏ ɪᴛᴇᴍs',usage:'†shop2',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const ITEMS={axe:{price:500,desc:'ᴍɪɴᴇ +50%'},rod:{price:400,desc:'ғɪsʜ +50%'},rifle:{price:600,desc:'ʜᴜɴᴛ +50%'}};
if(!args[0])return ctx.reply('🏪 *ɪᴛᴇᴍ sʜᴏᴘ*\n\n'+Object.entries(ITEMS).map(([k,v])=>'*'+k+'* - '+v.price+' ᴄᴏɪɴs\n_'+v.desc+'_').join('\n\n')+'\n\nᴜsᴇ: '+s.prefix+'shop2 <ɪᴛᴇᴍ>'+s.FOOTER);
const db=require('../../lib/database'),num=ctx.sender.split('@')[0];
const item=args[0].toLowerCase();if(!ITEMS[item])return ctx.reply('❌ ɪɴᴠᴀʟɪᴅ ɪᴛᴇᴍ.'+s.FOOTER);
const bal=db.getUser(num,'balance')||0;
if(bal<ITEMS[item].price)return ctx.reply('❌ ɴᴇᴇᴅ *'+ITEMS[item].price+'* ᴄᴏɪɴs.'+s.FOOTER);
db.setUser(num,'balance',bal-ITEMS[item].price);
const inv=db.getUser(num,'inventory')||{};inv[item]=(inv[item]||0)+1;
db.setUser(num,'inventory',inv);
await ctx.reply('✅ ʙᴏᴜɢʜᴛ *'+item+'* ғᴏʀ *'+ITEMS[item].price+'* ᴄᴏɪɴs!'+s.FOOTER);}};

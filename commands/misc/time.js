'use strict';
const axios=require('axios');
module.exports={name:'time',aliases:['worldtime','timezone2'],category:'misc',desc:'ɢᴇᴛ ᴡᴏʀʟᴅ ᴛɪᴍᴇ',usage:'†time <city>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const city=args.join(' ')||'Lagos';
try{const r=await require('axios').get('https://worldtimeapi.org/api/timezone');
const zones=r.data?.filter(z=>z.toLowerCase().includes(city.toLowerCase()));
if(!zones?.length)return ctx.reply('❌ ᴄɪᴛʏ ɴᴏᴛ ғᴏᴜɴᴅ.'+s.FOOTER);
const r2=await require('axios').get('https://worldtimeapi.org/api/timezone/'+zones[0]);
const d=new Date(r2.data.datetime);
await ctx.reply('🕐 *'+zones[0]+'*\n\n⏰ '+d.toLocaleTimeString()+'\n📅 '+d.toLocaleDateString()+s.FOOTER);}
catch{await ctx.reply('🕐 *ᴄᴜʀʀᴇɴᴛ ᴛɪᴍᴇ:* '+new Date().toLocaleString()+s.FOOTER);}}};

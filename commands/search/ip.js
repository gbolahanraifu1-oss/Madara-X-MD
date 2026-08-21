'use strict';
const axios=require('axios');
module.exports={name:'ip',aliases:['ipinfo','ipcheck'],category:'search',desc:'ʟᴏᴏᴋᴜᴘ ɪᴘ ᴀᴅᴅʀᴇss',usage:'†ip <address>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const ip=args[0]||'';
try{const r=await require('axios').get('https://ipapi.co/'+(ip||'json')+'/json/');
const d=r.data;
await ctx.reply('🌐 *ɪᴘ ɪɴғᴏ*\n\n📍 ɪᴘ: *'+d.ip+'*\n🏙️ ᴄɪᴛʏ: *'+d.city+'*\n🌍 ᴄᴏᴜɴᴛʀʏ: *'+d.country_name+'*\n🌐 ɪsᴘ: *'+d.org+'*\n🕐 ᴛɪᴍᴇᴢᴏɴᴇ: *'+d.timezone+'*'+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

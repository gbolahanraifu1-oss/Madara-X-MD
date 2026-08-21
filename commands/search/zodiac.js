'use strict';
const axios=require('axios');
module.exports={name:'zodiac',aliases:['horoscope','starsign'],category:'search',desc:'ɢᴇᴛ ʏᴏᴜʀ ᴢᴏᴅɪᴀᴄ ʀᴇᴀᴅɪɴɢ',usage:'†zodiac <sign>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=(args[0]||'aries').toLowerCase();
const signs=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
if(!signs.includes(q))return ctx.reply('❌ ᴠᴀʟɪᴅ sɪɢɴs: '+signs.join(', ')+s.FOOTER);
try{const r=await require('axios').get('https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily?sign='+q+'&day=TODAY');
await ctx.reply('⭐ *'+q.toUpperCase()+'*\n\n'+r.data?.data?.horoscope_data+s.FOOTER);}
catch{await ctx.reply('🔮 *'+q.toUpperCase()+'*\n\nᴛʜᴇ sᴛᴀʀs ᴀʀᴇ ᴀʟɪɢɴɪɴɢ ɪɴ ʏᴏᴜʀ ғᴀᴠᴏʀ ᴛᴏᴅᴀʏ!'+s.FOOTER);}}};

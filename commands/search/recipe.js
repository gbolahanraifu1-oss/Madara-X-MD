'use strict';
const axios=require('axios');
module.exports={name:'recipe',aliases:['food','cook','meal'],category:'search',desc:'ɢᴇᴛ ᴀ ʀᴇᴄɪᴘᴇ',usage:'†recipe <dish>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'recipe jollof rice'+s.FOOTER);
try{const r=await require('axios').get('https://www.themealdb.com/api/json/v1/1/search.php?s='+encodeURIComponent(q));
const m=r.data?.meals?.[0];if(!m)throw new Error();
await sock.sendMessage(ctx.from,{image:{url:m.strMealThumb},
caption:'🍽️ *'+m.strMeal+'*\n🌍 '+m.strArea+' | 🏷️ '+m.strCategory+'\n\n📋 *ɪɴɢʀᴇᴅɪᴇɴᴛs:*\n'+[...Array(20).keys()].map(i=>m['strIngredient'+(i+1)]&&m['strMeasure'+(i+1)]?m['strMeasure'+(i+1)]+' '+m['strIngredient'+(i+1)]:null).filter(Boolean).slice(0,10).join('\n')+'\n\n📖 '+m.strInstructions?.slice(0,400)+'...'+s.FOOTER},{quoted:msg});}
catch{await ctx.reply('❌ ʀᴇᴄɪᴘᴇ ɴᴏᴛ ғᴏᴜɴᴅ.'+s.FOOTER);}}};

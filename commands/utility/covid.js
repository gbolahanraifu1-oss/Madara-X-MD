'use strict';
const axios=require('axios');
module.exports={name:'covid',aliases:['corona','covidstats'],category:'utility',desc:'ɢᴇᴛ ᴄᴏᴠɪᴅ sᴛᴀᴛs',usage:'†covid [country]',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const country=args.join(' ')||'all';
try{const r=await require('axios').get('https://disease.sh/v3/covid-19/'+(country==='all'?'all':'countries/'+encodeURIComponent(country)));
const d=r.data;
await ctx.reply('😷 *ᴄᴏᴠɪᴅ sᴛᴀᴛs* ('+d.country||'ɢʟᴏʙᴀʟ'+')\n\n✅ ᴄᴀsᴇs: *'+d.cases?.toLocaleString()+'*\n💚 ʀᴇᴄᴏᴠᴇʀᴇᴅ: *'+d.recovered?.toLocaleString()+'*\n💔 ᴅᴇᴀᴛʜs: *'+d.deaths?.toLocaleString()+'*\n🔄 ᴀᴄᴛɪᴠᴇ: *'+d.active?.toLocaleString()+'*'+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

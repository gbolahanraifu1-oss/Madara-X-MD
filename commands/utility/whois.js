'use strict';
const axios=require('axios');
module.exports={name:'whois',aliases:['domaininfo','ipdomain'],category:'utility',desc:'ɢᴇᴛ ᴡʜᴏɪs ɪɴғᴏ',usage:'†whois <domain>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const d=args[0];if(!d)return ctx.reply('❌ '+s.prefix+'whois google.com'+s.FOOTER);
try{const r=await require('axios').get('https://api.api-ninjas.com/v1/whois?domain='+encodeURIComponent(d),{headers:{'X-Api-Key':'aN4y2/kNX1lBPgFdTjQaQg==KBvFc6l9jN9rHEzL'}});
const w=r.data;await ctx.reply('🔍 *ᴡʜᴏɪs: '+d+'*\n\n📅 ᴄʀᴇᴀᴛᴇᴅ: '+(w.creation_date||'N/A')+'\n🏢 ʀᴇɢɪsᴛʀᴀʀ: '+(w.registrar||'N/A')+'\n🌍 ᴄᴏᴜɴᴛʀʏ: '+(w.country||'N/A')+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

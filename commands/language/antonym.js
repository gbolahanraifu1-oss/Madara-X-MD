'use strict';
const axios=require('axios');
module.exports={name:'antonym',aliases:['ant','opposite'],category:'language',desc:'ғɪɴᴅ ᴀɴᴛᴏɴʏᴍs',usage:'†antonym <word>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args[0];if(!q)return ctx.reply('❌ '+s.prefix+'antonym happy'+s.FOOTER);
try{const r=await require('axios').get('https://api.api-ninjas.com/v1/thesaurus?word='+encodeURIComponent(q),{headers:{'X-Api-Key':'aN4y2/kNX1lBPgFdTjQaQg==KBvFc6l9jN9rHEzL'}});
const ants=r.data?.antonyms?.slice(0,10).join(', ')||'ɴᴏɴᴇ ғᴏᴜɴᴅ';
await ctx.reply('📚 *ᴀɴᴛᴏɴʏᴍs ᴏғ "'+q+'":*\n\n'+ants+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

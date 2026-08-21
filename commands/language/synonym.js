'use strict';
const axios=require('axios');
module.exports={name:'synonym',aliases:['syn','thesaurus'],category:'language',desc:'ғɪɴᴅ sʏɴᴏɴʏᴍs',usage:'†synonym <word>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args[0];if(!q)return ctx.reply('❌ '+s.prefix+'synonym happy'+s.FOOTER);
try{const r=await require('axios').get('https://api.api-ninjas.com/v1/thesaurus?word='+encodeURIComponent(q),{headers:{'X-Api-Key':'aN4y2/kNX1lBPgFdTjQaQg==KBvFc6l9jN9rHEzL'}});
const syns=r.data?.synonyms?.slice(0,10).join(', ')||'ɴᴏɴᴇ ғᴏᴜɴᴅ';
await ctx.reply('📚 *sʏɴᴏɴʏᴍs ᴏғ "'+q+'":*\n\n'+syns+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

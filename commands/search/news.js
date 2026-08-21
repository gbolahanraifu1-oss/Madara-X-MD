'use strict';
const axios=require('axios');
module.exports={name:'news',aliases:['latestnews','headlines'],category:'search',desc:'ɢᴇᴛ ʟᴀᴛᴇsᴛ ɴᴇᴡs',usage:'†news [topic]',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ')||'technology';
try{const r=await require('axios').get('https://api.dreaded.site/api/news?q='+encodeURIComponent(q));
const items=r.data?.result?.slice(0,5);if(!items?.length)throw new Error();
const lines=items.map((n,i)=>(i+1)+'. *'+n.title?.slice(0,80)+'*\n🔗 '+n.link).join('\n\n');
await ctx.reply('📰 *ʟᴀᴛᴇsᴛ ɴᴇᴡs: '+q+'*\n\n'+lines+s.FOOTER);}
catch{await ctx.reply('❌ ɴᴇᴡs ᴜɴᴀᴠᴀɪʟᴀʙʟᴇ.'+s.FOOTER);}}};

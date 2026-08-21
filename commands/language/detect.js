'use strict';
const axios=require('axios');
module.exports={name:'detect',aliases:['langdetect','whatlang'],category:'language',desc:'ᴅᴇᴛᴇᴄᴛ ʟᴀɴɢᴜᴀɢᴇ',usage:'†detect <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'detect Bonjour'+s.FOOTER);
try{const r=await require('axios').get('https://api.dreaded.site/api/detect-lang?text='+encodeURIComponent(q));
await ctx.reply('🌐 *ᴅᴇᴛᴇᴄᴛᴇᴅ:* '+(r.data?.result?.language||r.data?.language||'ᴜɴᴋɴᴏᴡɴ')+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

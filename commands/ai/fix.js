'use strict';
const axios=require('axios');
module.exports={name:'fix',aliases:['fixcode','debugcode'],category:'ai',desc:'ᴀɪ ᴄᴏᴅᴇ ғɪxᴇʀ',usage:'†fix <code>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ ᴘᴀsᴛᴇ ʏᴏᴜʀ ᴄᴏᴅᴇ.'+s.FOOTER);
await ctx.react('⏳');
try{const r=await require('axios').get('https://api.dreaded.site/api/gpt?text=Fix+and+explain+this+code:+'+encodeURIComponent(q));
await ctx.reply('🛠️ *ᴀɪ ᴄᴏᴅᴇ ғɪx*\n\n'+(r.data?.result||r.data?.message||'ɴᴏ ʀᴇsᴘᴏɴsᴇ.')+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

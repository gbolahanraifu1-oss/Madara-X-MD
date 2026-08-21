'use strict';
const axios=require('axios');
module.exports={name:'nameai',aliases:['suggestname','namegen'],category:'ai',desc:'ᴀɪ ɴᴀᴍᴇ ɢᴇɴᴇʀᴀᴛᴏʀ',usage:'†nameai <description>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ')||'a powerful whatsapp bot';
await ctx.react('⏳');
try{const r=await require('axios').get('https://api.dreaded.site/api/gpt?text=Suggest+5+creative+names+for:+'+encodeURIComponent(q));
await ctx.reply('✨ *ɴᴀᴍᴇ sᴜɢɢᴇsᴛɪᴏɴs*\n\n'+(r.data?.result||r.data?.message||'ɴᴏ ʀᴇsᴘᴏɴsᴇ.')+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

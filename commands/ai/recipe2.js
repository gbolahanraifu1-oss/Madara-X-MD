'use strict';
const axios=require('axios');
module.exports={name:'recipe2',aliases:['cookingai','airecipe'],category:'ai',desc:'ᴀɪ ʀᴇᴄɪᴘᴇ ɢᴇɴᴇʀᴀᴛᴏʀ',usage:'†recipe2 <dish or ingredients>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ')||'jollof rice';
await ctx.react('⏳');
try{const r=await require('axios').get('https://api.dreaded.site/api/gpt?text=Give+me+a+recipe+for:+'+encodeURIComponent(q));
await ctx.reply('🍽️ *ᴀɪ ʀᴇᴄɪᴘᴇ*\n\n'+(r.data?.result||r.data?.message||'ɴᴏ ʀᴇsᴘᴏɴsᴇ.')+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

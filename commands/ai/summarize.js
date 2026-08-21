'use strict';
const axios=require('axios');
module.exports={name:'summarize',aliases:['summary','tldr'],category:'ai',desc:'sᴜᴍᴍᴀʀɪᴢᴇ ᴛᴇxᴛ',usage:'†summarize <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ ᴘᴀsᴛᴇ ᴛᴇxᴛ ᴛᴏ sᴜᴍᴍᴀʀɪᴢᴇ.'+s.FOOTER);
await ctx.react('⏳');
try{const r=await require('axios').get('https://api.dreaded.site/api/gpt?text=Summarize+this+in+3+bullet+points:+'+encodeURIComponent(q));
await ctx.reply('📋 *sᴜᴍᴍᴀʀʏ*\n\n'+(r.data?.result||r.data?.message||'ɴᴏ ʀᴇsᴘᴏɴsᴇ.')+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

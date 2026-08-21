'use strict';
const axios=require('axios');
module.exports={name:'predict',aliases:['future','aipredict'],category:'ai',desc:'ᴀɪ ᴘʀᴇᴅɪᴄᴛɪᴏɴ',usage:'†predict <question>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ')||'my future';
await ctx.react('⏳');
try{const r=await require('axios').get('https://api.dreaded.site/api/gpt?text=Predict+this+in+a+fun+way:+'+encodeURIComponent(q));
await ctx.reply('🔮 *ᴘʀᴇᴅɪᴄᴛɪᴏɴ*\n\n'+(r.data?.result||r.data?.message||'ɴᴏ ʀᴇsᴘᴏɴsᴇ.')+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

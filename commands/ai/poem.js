'use strict';
const axios=require('axios');
module.exports={name:'poem',aliases:['poetry','aipoem','writepoem'],category:'ai',desc:'ᴀɪ ᴘᴏᴇᴍ ɢᴇɴᴇʀᴀᴛᴏʀ',usage:'†poem <topic>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ')||'love';
await ctx.react('⏳');
try{const r=await require('axios').get('https://api.dreaded.site/api/gpt?text=Write+a+short+poem+about:+'+encodeURIComponent(q));
await ctx.reply('🎭 *ᴀɪ ᴘᴏᴇᴍ*\n\n'+(r.data?.result||r.data?.message||'ɴᴏ ʀᴇsᴘᴏɴsᴇ.')+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

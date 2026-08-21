'use strict';
const axios=require('axios');
module.exports={name:'caption',aliases:['imagecaption','addcaption'],category:'ai',desc:'ɢᴇɴᴇʀᴀᴛᴇ ɪɢ ᴄᴀᴘᴛɪᴏɴ',usage:'†caption <topic>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ')||'sunset';
await ctx.react('⏳');
try{const r=await require('axios').get('https://api.dreaded.site/api/gpt?text=Write+3+Instagram+captions+for:+'+encodeURIComponent(q));
await ctx.reply('📸 *ᴄᴀᴘᴛɪᴏɴ ɪᴅᴇᴀs*\n\n'+(r.data?.result||r.data?.message||'ɴᴏ ʀᴇsᴘᴏɴsᴇ.')+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

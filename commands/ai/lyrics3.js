'use strict';
const axios=require('axios');
module.exports={name:'lyrics3',aliases:['songwrite','writelyrics'],category:'ai',desc:'ᴀɪ sᴏɴɢ ʟʏʀɪᴄs',usage:'†lyrics3 <topic>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ')||'hustle';
await ctx.react('⏳');
try{const r=await require('axios').get('https://api.dreaded.site/api/gpt?text=Write+song+lyrics+about:+'+encodeURIComponent(q));
await ctx.reply('🎵 *ᴀɪ ʟʏʀɪᴄs*\n\n'+(r.data?.result||r.data?.message||'ɴᴏ ʀᴇsᴘᴏɴsᴇ.')+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

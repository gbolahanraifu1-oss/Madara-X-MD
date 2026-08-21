'use strict';
const axios=require('axios');
module.exports={name:'paraphrase',aliases:['rephrase','rewrite'],category:'misc',desc:'ʀᴇᴡʀɪᴛᴇ ᴛᴇxᴛ',usage:'†paraphrase <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ ᴘʀᴏᴠɪᴅᴇ ᴛᴇxᴛ.'+s.FOOTER);
await ctx.react('⏳');
try{const r=await require('axios').get('https://api.dreaded.site/api/gpt?text=Paraphrase+this+text:+'+encodeURIComponent(q));
await ctx.reply('✏️ *ʀᴇᴡʀɪᴛᴛᴇɴ*\n\n'+(r.data?.result||r.data?.message||q)+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

'use strict';
const axios=require('axios');
module.exports={name:'base64decode',aliases:['b64d','decode64'],category:'utility',desc:'ᴅᴇᴄᴏᴅᴇ ʙᴀsᴇ64',usage:'†base64decode <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'base64decode aGVsbG8='+s.FOOTER);
try{await ctx.reply('🔓 *ᴅᴇᴄᴏᴅᴇᴅ:*\n\n'+Buffer.from(q,'base64').toString()+s.FOOTER);}
catch{await ctx.reply('❌ ɪɴᴠᴀʟɪᴅ ʙᴀsᴇ64.'+s.FOOTER);}}};

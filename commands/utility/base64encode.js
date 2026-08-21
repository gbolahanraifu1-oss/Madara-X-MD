'use strict';
const axios=require('axios');
module.exports={name:'base64encode',aliases:['b64e','encode64'],category:'utility',desc:'ᴇɴᴄᴏᴅᴇ ᴛᴏ ʙᴀsᴇ64',usage:'†base64encode <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'base64encode hello'+s.FOOTER);
await ctx.reply('🔐 *ʙᴀsᴇ64:*\n\n'+Buffer.from(q).toString('base64')+s.FOOTER);}};

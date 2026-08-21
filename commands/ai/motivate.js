'use strict';
const axios=require('axios');
module.exports={name:'motivate',aliases:['inspire2','aiinspire'],category:'ai',desc:'ᴀɪ ᴍᴏᴛɪᴠᴀᴛɪᴏɴ',usage:'†motivate',
async execute(sock,msg,args,ctx){const s=ctx.settings;
await ctx.react('⏳');
try{const r=await require('axios').get('https://api.dreaded.site/api/gpt?text=Give+me+a+powerful+motivational+message');
await ctx.reply('💪 *ᴍᴏᴛɪᴠᴀᴛɪᴏɴ*\n\n'+(r.data?.result||r.data?.message||'ʏᴏᴜ ᴄᴀɴ ᴅᴏ ɪᴛ!')+s.FOOTER);}
catch{await ctx.reply('💪 *ᴍᴏᴛɪᴠᴀᴛɪᴏɴ*\n\nʙᴇʟɪᴇᴠᴇ ɪɴ ʏᴏᴜʀsᴇʟғ. ᴛʜᴇ ᴏɴʟʏ ʟɪᴍɪᴛ ɪs ʏᴏᴜʀ ᴍɪɴᴅ!'+s.FOOTER);}}};

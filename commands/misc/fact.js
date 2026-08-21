'use strict';
const axios=require('axios');
module.exports={name:'fact',aliases:['randomfact','funfact'],category:'misc',desc:'ɢᴇᴛ ᴀ ʀᴀɴᴅᴏᴍ ғᴀᴄᴛ',usage:'†fact',
async execute(sock,msg,args,ctx){const s=ctx.settings;
try{const r=await require('axios').get('https://api.api-ninjas.com/v1/facts?limit=1',{headers:{'X-Api-Key':'aN4y2/kNX1lBPgFdTjQaQg==KBvFc6l9jN9rHEzL'}});
await ctx.reply('💡 *ʀᴀɴᴅᴏᴍ ғᴀᴄᴛ*\n\n'+r.data?.[0]?.fact+s.FOOTER);}
catch{await ctx.reply('💡 ᴀ ɢʀᴏᴜᴘ ᴏғ ғʟᴀᴍɪɴɢᴏs ɪs ᴄᴀʟʟᴇᴅ ᴀ "ғʟᴀᴍʙᴏʏᴀɴᴄᴇ".'+s.FOOTER);}}};

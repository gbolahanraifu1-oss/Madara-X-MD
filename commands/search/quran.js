'use strict';
const axios=require('axios');
module.exports={name:'quran',aliases:['ayah','verse'],category:'search',desc:'sᴇᴀʀᴄʜ Q̲ᴜʀᴀɴ ᴠᴇʀsᴇ',usage:'†quran <surah>:<ayah>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const[surah,ayah]=(args[0]||'1:1').split(':');
try{const r=await require('axios').get('https://api.alquran.cloud/v1/ayah/'+surah+':'+ayah+'/en.asad');
const v=r.data?.data;if(!v)throw new Error();
await ctx.reply('📖 *Q̲ᴜʀᴀɴ '+surah+':'+ayah+'*\n\n'+v.text+'\n\n_Surah: '+v.surah.englishName+'_'+s.FOOTER);}
catch{await ctx.reply('❌ ᴠᴇʀsᴇ ɴᴏᴛ ғᴏᴜɴᴅ.'+s.FOOTER);}}};

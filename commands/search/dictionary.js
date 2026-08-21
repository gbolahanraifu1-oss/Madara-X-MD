'use strict';
const axios=require('axios');
module.exports={name:'dictionary',aliases:['dict','define2','meaning'],category:'search',desc:'ʟᴏᴏᴋᴜᴘ ᴡᴏʀᴅ ᴅᴇғɪɴɪᴛɪᴏɴ',usage:'†dictionary <word>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args[0];if(!q)return ctx.reply('❌ '+s.prefix+'dictionary serendipity'+s.FOOTER);
try{const r=await require('axios').get('https://api.dictionaryapi.dev/api/v2/entries/en/'+encodeURIComponent(q));
const d=r.data[0];const def=d.meanings[0]?.definitions[0];
await ctx.reply('📖 *'+d.word+'*\n\n📝 '+d.meanings[0]?.partOfSpeech+'\n\n'+def?.definition+'\n\n💬 *ᴇxᴀᴍᴘʟᴇ:* '+(def?.example||'ɴ/ᴀ')+s.FOOTER);}
catch{await ctx.reply('❌ ᴡᴏʀᴅ ɴᴏᴛ ғᴏᴜɴᴅ.'+s.FOOTER);}}};

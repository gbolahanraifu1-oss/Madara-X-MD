'use strict';
const axios=require('axios');
module.exports={name:'define',aliases:['def','meaning2'],category:'search',desc:'ᴅᴇғɪɴᴇ ᴀ ᴡᴏʀᴅ',usage:'†define <word>',
async execute(sock,msg,args,ctx){const s=ctx.settings;const q=args[0];if(!q)return ctx.reply('❌ '+s.prefix+'define serendipity'+s.FOOTER);
try{const r=await axios.get('https://api.dictionaryapi.dev/api/v2/entries/en/'+encodeURIComponent(q));
const d=r.data[0];const def=d.meanings[0]?.definitions[0];
await ctx.reply('📖 *'+d.word+'*\n('+d.meanings[0]?.partOfSpeech+')\n\n'+def?.definition+(def?.example?'\n\n💬 _'+def.example+'_':'')+s.FOOTER);}catch{await ctx.reply('❌ ɴᴏᴛ ғᴏᴜɴᴅ.'+s.FOOTER);}}};

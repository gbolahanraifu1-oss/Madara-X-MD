'use strict';
const axios=require('axios');
module.exports={name:'movie2',aliases:['imdb2','filminfo'],category:'search',desc:'sᴇᴀʀᴄʜ ᴛᴏᴘ ᴍᴏᴠɪᴇs',usage:'†movie2 <title>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ')||'avengers';
try{const r=await require('axios').get('https://www.omdbapi.com/?s='+encodeURIComponent(q)+'&apikey=fc4fd0d8');
const movies=r.data?.Search?.slice(0,5);if(!movies?.length)throw new Error('ɴᴏᴛ ғᴏᴜɴᴅ');
const lines=movies.map(m=>'*'+m.Title+'* ('+m.Year+')\n🎬 '+m.Type).join('\n\n');
await ctx.reply('🎬 *sᴇᴀʀᴄʜ ʀᴇsᴜʟᴛs:*\n\n'+lines+'\n\n_ᴜsᴇ .movie <ᴛɪᴛʟᴇ> ғᴏʀ ᴅᴇᴛᴀɪʟs_'+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

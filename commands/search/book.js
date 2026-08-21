'use strict';
const axios=require('axios');
module.exports={name:'book',aliases:['booksearch','findbook'],category:'search',desc:'sᴇᴀʀᴄʜ ʙᴏᴏᴋ',usage:'†book <title>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'book Atomic Habits'+s.FOOTER);
try{const r=await require('axios').get('https://openlibrary.org/search.json?q='+encodeURIComponent(q)+'&limit=3');
const books=r.data?.docs?.slice(0,3);if(!books?.length)throw new Error('ɴᴏᴛ ғᴏᴜɴᴅ');
const lines=books.map(b=>'*'+b.title+'*\n👤 '+(b.author_name?.[0]||'N/A')+' ('+( b.first_publish_year||'?')+')').join('\n\n');
await ctx.reply('📚 *ʙᴏᴏᴋs:*\n\n'+lines+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

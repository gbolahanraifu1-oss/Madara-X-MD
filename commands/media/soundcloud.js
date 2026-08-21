'use strict';
module.exports={name:'soundcloud',aliases:['scdl','sc'],category:'media',desc:'ᴅᴏᴡɴʟᴏᴀᴅ sᴏᴜɴᴅᴄʟᴏᴜᴅ',usage:'†soundcloud <url or title>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'soundcloud Alone'+s.FOOTER);
await ctx.react('⏳');
try{const r=await require('axios').get('https://api.dreaded.site/api/soundcloud?query='+encodeURIComponent(q));
const d=r.data?.result;if(!d?.audio)throw new Error('ɴᴏᴛ ғᴏᴜɴᴅ');
await sock.sendMessage(ctx.from,{audio:{url:d.audio},mimetype:'audio/mpeg',caption:'☁️ '+d.title+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

'use strict';
module.exports={name:'audiodl',aliases:['dlaud','downloadaudio'],category:'media',desc:'ᴅᴏᴡɴʟᴏᴀᴅ ᴀᴜᴅɪᴏ ғʀᴏᴍ ᴜʀʟ',usage:'†audiodl <url>',
async execute(sock,msg,args,ctx){const s=ctx.settings;const url=args[0];if(!url)return ctx.reply('❌ '+s.prefix+'audiodl <url>'+s.FOOTER);
await ctx.react('⏳');
try{await sock.sendMessage(ctx.from,{audio:{url},mimetype:'audio/mpeg',ptt:false,caption:'🎵'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

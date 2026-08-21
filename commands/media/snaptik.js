'use strict';
module.exports={name:'snaptik',aliases:['snap','snaptikvid'],category:'media',desc:'ᴅᴏᴡɴʟᴏᴀᴅ ᴛɪᴋᴛᴏᴋ (sɴᴀᴘᴛɪᴋ)',usage:'†snaptik <url>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const url=args[0];if(!url)return ctx.reply('❌ '+s.prefix+'snaptik <url>'+s.FOOTER);
await ctx.react('⏳');
try{const r=await require('axios').get('https://api.ryzendesu.vip/api/downloader/ttdl?url='+encodeURIComponent(url));
const v=r.data?.data?.play||r.data?.data?.wmplay;if(!v)throw new Error('ɴᴏ ᴠɪᴅᴇᴏ');
await sock.sendMessage(ctx.from,{video:{url:v},mimetype:'video/mp4',caption:'🎵 ᴛɪᴋᴛᴏᴋ'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

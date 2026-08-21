'use strict';
module.exports={name:'ytmp4',aliases:['videodl','yt','ytdl'],category:'media',desc:'ᴅᴏᴡɴʟᴏᴀᴅ ʏᴏᴜᴛᴜʙᴇ ᴠɪᴅᴇᴏ',usage:'†ytmp4 <url>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const url=args[0];if(!url?.startsWith('http'))return ctx.reply('❌ ᴘʀᴏᴠɪᴅᴇ ᴀ ʏᴏᴜᴛᴜʙᴇ ᴜʀʟ.'+s.FOOTER);
await ctx.react('⏳');
try{const axios=require('axios');
const r=await axios.get('https://api.dreaded.site/api/ytdl?url='+encodeURIComponent(url));
const vid=r.data?.result?.video||r.data?.url;if(!vid)throw new Error('ɴᴏ ᴠɪᴅᴇᴏ');
await sock.sendMessage(ctx.from,{video:{url:vid},mimetype:'video/mp4',caption:'📹 ʏᴏᴜᴛᴜʙᴇ ᴠɪᴅᴇᴏ'+s.FOOTER},{quoted:msg});
}catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

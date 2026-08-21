'use strict';
module.exports={name:'ytmp3',aliases:['mp3dl','audiodownload','yta'],category:'media',desc:'ᴅᴏᴡɴʟᴏᴀᴅ ʏᴏᴜᴛᴜʙᴇ ᴀᴜᴅɪᴏ',usage:'†ytmp3 <url or title>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'ytmp3 despacito'+s.FOOTER);
await ctx.react('⏳');
try{const yts=require('yt-search');const url=q.startsWith('http')?q:(await yts(q)).videos[0]?.url;
if(!url)throw new Error('ɴᴏᴛ ғᴏᴜɴᴅ');
const ytdl=require('@distube/ytdl-core');const info=await ytdl.getInfo(url);
const title=info.videoDetails.title;
const stream=ytdl(url,{filter:'audioonly',quality:'highestaudio'});
const chunks=[];stream.on('data',c=>chunks.push(c));
await new Promise((res,rej)=>{stream.on('end',res);stream.on('error',rej);});
const buf=Buffer.concat(chunks);
await sock.sendMessage(ctx.from,{document:buf,mimetype:'audio/mpeg',fileName:title.slice(0,50)+'.mp3',caption:'🎵 '+title+s.FOOTER},{quoted:msg});
}catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

'use strict';
module.exports={name:'spotify',aliases:['spotdl','spotifydownload'],category:'media',desc:'ᴅᴏᴡɴʟᴏᴀᴅ sᴘᴏᴛɪғʏ ᴛʀᴀᴄᴋ',usage:'†spotify <title>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'spotify Shape of You'+s.FOOTER);
await ctx.react('⏳');
try{const r=await require('axios').get('https://api.dreaded.site/api/spotify?query='+encodeURIComponent(q));
const d=r.data?.result||r.data;if(!d?.download)throw new Error('ɴᴏᴛ ғᴏᴜɴᴅ');
await sock.sendMessage(ctx.from,{audio:{url:d.download},mimetype:'audio/mpeg',
contextInfo:{externalAdReply:{title:d.title||q,body:d.artist||'Spotify',thumbnailUrl:d.image,sourceUrl:'https://spotify.com',mediaType:1}}},{quoted:msg});
}catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

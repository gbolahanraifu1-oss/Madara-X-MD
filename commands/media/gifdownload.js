'use strict';
module.exports={name:'gifdownload',aliases:['gif','getgif'],category:'media',desc:'sᴇᴀʀᴄʜ ᴀɴᴅ sᴇɴᴅ ɢɪғ',usage:'†gif <query>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ')||'anime';
try{const r=await require('axios').get('https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag='+encodeURIComponent(q));
const url=r.data?.data?.images?.original?.url;if(!url)throw new Error();
await sock.sendMessage(ctx.from,{video:{url},gifPlayback:true,caption:'🎞️ '+q+s.FOOTER},{quoted:msg});}
catch{await ctx.reply('❌ ɢɪғ ɴᴏᴛ ғᴏᴜɴᴅ.'+s.FOOTER);}}};

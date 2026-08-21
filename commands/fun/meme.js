'use strict';
const axios=require('axios');
const SUBS=['memes','dankmemes','me_irl','funny','wholesomememes'];
module.exports={name:'meme',aliases:['randommeme','getmeme'],category:'fun',desc:'ɢᴇᴛ ᴀ ʀᴀɴᴅᴏᴍ ᴍᴇᴍᴇ',usage:'†meme',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const sub=SUBS[Math.floor(Math.random()*SUBS.length)];
try{const r=await axios.get(`https://www.reddit.com/r/${sub}/random.json?limit=1`,{headers:{'User-Agent':'MadaraBot/1.0'}});
const post=r.data?.[0]?.data?.children?.[0]?.data;
if(!post||!post.url?.match(/\.(jpg|jpeg|png|gif)/i))throw new Error('no image');
await sock.sendMessage(ctx.from,{image:{url:post.url},caption:`😂 *${post.title?.slice(0,100)||'ᴍᴇᴍᴇ'}*\n⬆️ ${post.ups}${s.FOOTER}`},{quoted:msg});
}catch{await ctx.reply(`❌ ᴄᴏᴜʟᴅɴ'ᴛ ғᴇᴛᴄʜ ᴍᴇᴍᴇ. ᴛʀʏ ᴀɢᴀɪɴ.${s.FOOTER}`);}
}};

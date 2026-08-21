'use strict';
const axios=require('axios');
const AQ=['ᴘᴇᴏᴘʟᴇ\'s ᴅʀᴇᴀᴍs ɴᴇᴠᴇʀ ᴇɴᴅ! — ᴍᴀʀsʜᴀʟʟ D. ᴛᴇᴀᴄʜ','ɪ\'ᴍ ɴᴏᴛ ɢᴏɪɴɢ ᴛᴏ ʀᴜɴ ᴀᴡᴀʏ, ɪ ɴᴇᴠᴇʀ ᴡᴇɴᴛ ʙᴀᴄᴋ ᴏɴ ᴍʏ ᴡᴏʀᴅ! — ɴᴀʀᴜᴛᴏ','ᴡᴀᴋᴇ ᴜᴘ ᴛᴏ ʀᴇᴀʟɪᴛʏ! — ᴍᴀᴅᴀʀᴀ ᴜᴄʜɪʜᴀ','ᴘᴏᴡᴇʀ ɪs ɴᴏᴛ ᴡɪʟʟ, ɪᴛ ɪs ᴛʜᴇ ᴘʜᴇɴᴏᴍᴇɴᴏɴ ᴏғ ᴘʜʏsɪᴄᴀʟ sᴛʀᴇɴɢᴛʜ — ʙᴏʀᴏ'];
module.exports={name:'animequote',aliases:['aq','aquote'],category:'fun',desc:'ɢᴇᴛ ᴀɴ ᴀɴɪᴍᴇ Q̲ᴜᴏᴛᴇ',usage:'†animequote',
async execute(sock,msg,args,ctx){const s=ctx.settings;
try{const r=await axios.get('https://animechan.io/api/v1/quotes/random');
const q=r.data?.data;
if(q)return ctx.reply(`✨ *ᴀɴɪᴍᴇ Q̲ᴜᴏᴛᴇ*\n\n"${q.content}"\n— _${q.character.name}_ (${q.anime.name})${s.FOOTER}`);
}catch{}
await ctx.reply(`✨ *ᴀɴɪᴍᴇ Q̲ᴜᴏᴛᴇ*\n\n${AQ[Math.floor(Math.random()*AQ.length)]}${s.FOOTER}`);
}};

'use strict';
const axios=require('axios');
module.exports={name:'passwordgen',aliases:['passgen','genpass','randpass'],category:'utility',desc:'ɢᴇɴᴇʀᴀᴛᴇ sᴇᴄᴜʀᴇ ᴘᴀssᴡᴏʀᴅ',usage:'†passwordgen [length]',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const len=Math.min(parseInt(args[0])||16,64);
const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
const pass=Array.from({length:len},()=>chars[Math.floor(Math.random()*chars.length)]).join('');
await ctx.reply('🔐 *ɢᴇɴᴇʀᴀᴛᴇᴅ ᴘᴀssᴡᴏʀᴅ:*\n\n\`'+pass+'\`\n\n_ᴅᴏ ɴᴏᴛ sʜᴀʀᴇ ᴛʜɪs!_'+s.FOOTER);}};

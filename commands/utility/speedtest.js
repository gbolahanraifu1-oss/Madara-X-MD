'use strict';
const axios=require('axios');
module.exports={name:'speedtest',aliases:['netspeed','ping2'],category:'utility',desc:'ᴛᴇsᴛ sᴇʀᴠᴇʀ ɴᴇᴛᴡᴏʀᴋ sᴘᴇᴇᴅ',usage:'†speedtest',
async execute(sock,msg,args,ctx){const s=ctx.settings;
await ctx.react('⏳');
const os=require('os');const start=Date.now();
try{await require('axios').get('https://www.google.com',{timeout:5000});}catch{}
const ping=Date.now()-start;
const mem=os.totalmem(),free=os.freemem(),used=mem-free;
await ctx.reply('🌐 *sᴇʀᴠᴇʀ sᴛᴀᴛs*\n\n📡 ᴘɪɴɢ: *'+ping+'ᴍs*\n💾 ʀᴀᴍ: *'+Math.round(used/1048576)+'/'+ Math.round(mem/1048576)+'ᴍʙ*\n🖥️ ᴄᴘᴜs: *'+os.cpus().length+'*\n⏱️ ᴜᴘᴛɪᴍᴇ: *'+Math.floor(process.uptime()/3600)+'ʜ*'+s.FOOTER);}};

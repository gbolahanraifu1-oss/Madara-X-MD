'use strict';
const axios=require('axios');
module.exports={name:'loading',aliases:['progressbar','fakeload'],category:'misc',desc:'ғᴀᴋᴇ ʟᴏᴀᴅɪɴɢ ʙᴀʀ',usage:'†loading <task>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const task=args.join(' ')||'ʟᴏᴀᴅɪɴɢ';
const m=await ctx.reply('⏳ *'+task+'*\n\n[░░░░░░░░░░] 0%'+s.FOOTER);
const bars=['▓░░░░░░░░░','▓▓░░░░░░░░','▓▓▓░░░░░░░','▓▓▓▓░░░░░░','▓▓▓▓▓░░░░░','▓▓▓▓▓▓░░░░','▓▓▓▓▓▓▓░░░','▓▓▓▓▓▓▓▓░░','▓▓▓▓▓▓▓▓▓░','▓▓▓▓▓▓▓▓▓▓'];
for(let i=0;i<bars.length;i++){await new Promise(r=>setTimeout(r,500));
await sock.sendMessage(ctx.from,{text:'⏳ *'+task+'*\n\n['+bars[i]+'] '+(i+1)*10+'%'+s.FOOTER,edit:m.key});}
await sock.sendMessage(ctx.from,{text:'✅ *'+task+'* — ᴄᴏᴍᴘʟᴇᴛᴇ!'+s.FOOTER,edit:m.key});}};

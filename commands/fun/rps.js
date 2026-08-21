'use strict';
module.exports={name:'rps',aliases:['rockpaperscissors','rpsplay'],category:'fun',desc:'ʀᴏᴄᴋ ᴘᴀᴘᴇʀ sᴄɪssᴏʀs',usage:'†rps rock/paper/scissors',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const choices=['rock','paper','scissors'];
const pick=(args[0]||'').toLowerCase();
if(!choices.includes(pick))return ctx.reply('❌ ᴄʜᴏᴏsᴇ: rock, paper, scissors'+s.FOOTER);
const bot=choices[Math.floor(Math.random()*3)];
const wins={rock:'scissors',paper:'rock',scissors:'paper'};
const result=bot===pick?'🤝 ᴅʀᴀᴡ!':wins[pick]===bot?'🎉 ʏᴏᴜ ᴡɪɴ!':'😈 ɪ ᴡɪɴ!';
await ctx.reply('✊ *ʀᴘs*\n\n👤 ʏᴏᴜ: *'+pick+'*\n🤖 ʙᴏᴛ: *'+bot+'*\n\n'+result+s.FOOTER);}};

'use strict';
const axios=require('axios');
module.exports={name:'morse',aliases:['morsecode','dotdash'],category:'misc',desc:'ᴛᴇxᴛ ᴛᴏ ᴍᴏʀsᴇ ᴄᴏᴅᴇ',usage:'†morse <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const MC={A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.'};
const text=args.join(' ').toUpperCase();if(!text)return ctx.reply('❌ '+s.prefix+'morse hello'+s.FOOTER);
const morse=text.split('').map(c=>c===' '?'/':(MC[c]||c)).join(' ');
await ctx.reply('📡 *ᴍᴏʀsᴇ:*\n\n'+morse+s.FOOTER);}};

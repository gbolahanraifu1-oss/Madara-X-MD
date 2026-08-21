'use strict';
const axios=require('axios');
module.exports={name:'numbersystem',aliases:['bin2dec','dec2bin'],category:'misc',desc:'ɴᴜᴍʙᴇʀ sʏsᴛᴇᴍ ᴄᴏɴᴠᴇʀᴛᴇʀ',usage:'†numbersystem <value> <from> <to>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const[val,from,to]=[args[0],args[1]||'dec',args[2]||'bin'];
if(!val)return ctx.reply('❌ '+s.prefix+'numbersystem 255 dec bin'+s.FOOTER);
const bases={bin:2,oct:8,dec:10,hex:16};
try{const decimal=parseInt(val,bases[from]);
const result=decimal.toString(bases[to]).toUpperCase();
await ctx.reply('🔢 *'+val+' ('+from+') = '+result+' ('+to+')*'+s.FOOTER);}
catch{await ctx.reply('❌ ɪɴᴠᴀʟɪᴅ ᴄᴏɴᴠᴇʀsɪᴏɴ.'+s.FOOTER);}}};

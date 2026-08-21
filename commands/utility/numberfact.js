'use strict';
const axios=require('axios');
module.exports={name:'numberfact',aliases:['numfact','mathfact'],category:'utility',desc:'ɢᴇᴛ ᴀ ɴᴜᴍʙᴇʀ ғᴀᴄᴛ',usage:'†numberfact <number>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const n=args[0]||Math.floor(Math.random()*1000);
try{const r=await require('axios').get('http://numbersapi.com/'+n+'/trivia');
await ctx.reply('🔢 *ɴᴜᴍʙᴇʀ ғᴀᴄᴛ*\n\n'+r.data+s.FOOTER);}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

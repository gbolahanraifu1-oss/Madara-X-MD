'use strict';
const axios=require('axios');
module.exports={name:'tts2',aliases:['speak2','voice2'],category:'language',desc:'ᴛᴇxᴛ ᴛᴏ sᴘᴇᴇᴄʜ (ᴍᴜʟᴛɪʟᴀɴɢ)',usage:'†tts2 <lang> <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const lang=args[0]||'en',text=args.slice(1).join(' ');
if(!text)return ctx.reply('❌ '+s.prefix+'tts2 es Hola mundo'+s.FOOTER);
const url='https://translate.google.com/translate_tts?ie=UTF-8&q='+encodeURIComponent(text)+'&tl='+lang+'&client=tw-ob';
try{await sock.sendMessage(ctx.from,{audio:{url},mimetype:'audio/mpeg',ptt:true},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

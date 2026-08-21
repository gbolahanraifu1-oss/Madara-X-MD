'use strict';
module.exports={name:'radiodl',aliases:['radio','liveradio'],category:'media',desc:'ᴘʟᴀʏ ᴀ ʀᴀᴅɪᴏ sᴛᴀᴛɪᴏɴ',usage:'†radio <name>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const STATIONS={'lofi':'https://stream.lofi.cafe/lo-fi?type=.mp3','jazz':'http://jazz.streamr.ru/jazz-64.mp3','afro':'https://stream.zeno.fm/kfp0kdqe5k0uv','naija':'https://stream.zeno.fm/y7jp5p5uedduv'};
const name=(args[0]||'lofi').toLowerCase();const url=STATIONS[name];
if(!url)return ctx.reply('📻 *ᴀᴠᴀɪʟᴀʙʟᴇ:* '+Object.keys(STATIONS).join(', ')+s.FOOTER);
await sock.sendMessage(ctx.from,{audio:{url},mimetype:'audio/mpeg',ptt:false,fileName:name+'.mp3',caption:'📻 *'+name.toUpperCase()+' ʀᴀᴅɪᴏ*'+s.FOOTER},{quoted:msg});}};

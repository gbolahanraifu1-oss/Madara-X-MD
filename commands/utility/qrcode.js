'use strict';
const axios=require('axios');
module.exports={name:'qrcode',aliases:['qr','makeqr','createqr'],category:'utility',desc:'ɢᴇɴᴇʀᴀᴛᴇ ǫʀ ᴄᴏᴅᴇ',usage:'†qrcode <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'qrcode hello'+s.FOOTER);
await ctx.react('⏳');
try{const QR=require('qrcode');const buf=await QR.toBuffer(q,{width:512});
await sock.sendMessage(ctx.from,{image:buf,caption:'📱 *ǫʀ ᴄᴏᴅᴇ*'+s.FOOTER},{quoted:msg});}
catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

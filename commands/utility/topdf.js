'use strict';
const axios=require('axios');
module.exports={name:'topdf',aliases:['urltopdf','pdf'],category:'utility',desc:'ᴄᴏɴᴠᴇʀᴛ ᴜʀʟ ᴛᴏ ᴘᴅғ',usage:'†topdf <url>',
async execute(sock,msg,args,ctx){
const s=ctx.settings,url=args[0];
if(!url)return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}topdf https://example.com${s.FOOTER}`);
await ctx.react('⏳');
try{const res=await axios.get(`https://api.html2pdf.app/v1/generate?url=${encodeURIComponent(url)}&apiKey=free`,{responseType:'arraybuffer'});
await sock.sendMessage(ctx.from,{document:Buffer.from(res.data),mimetype:'application/pdf',fileName:'output.pdf'},{quoted:msg});
}catch(e){await ctx.reply(`❌ ${e.message}${s.FOOTER}`);}}};

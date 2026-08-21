'use strict';
module.exports={name:'calculator3',aliases:['calc3','mathsolve'],category:'utility',desc:'sᴛᴇᴘ ʙʏ sᴛᴇᴘ ᴄᴀʟᴄ',usage:'†calculator3 <expr>',
async execute(sock,msg,args,ctx){const s=ctx.settings;const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'calculator3 (2+3)*4'+s.FOOTER);
try{const r=require('mathjs').evaluate(q);await ctx.reply('🧮 *'+q+' = '+r+'*'+s.FOOTER);}catch{await ctx.reply('❌ ɪɴᴠᴀʟɪᴅ.'+s.FOOTER);}}};

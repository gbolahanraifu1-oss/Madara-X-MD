'use strict';
module.exports={name:'flipcoin',aliases:['coinflip','toss','flip'],category:'fun',desc:'ғʟɪᴘ ᴀ ᴄᴏɪɴ',usage:'†flipcoin',
async execute(sock,msg,args,ctx){const s=ctx.settings,r=Math.random()<.5;
await ctx.reply(`🪙 *ᴄᴏɪɴ ғʟɪᴘ*\n\n${r?'👑 *ʜᴇᴀᴅs!*':'🔵 *ᴛᴀɪʟs!*'}${s.FOOTER}`);}};

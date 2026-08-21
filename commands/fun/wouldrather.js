'use strict';
const W=[['fly','be invisible'],['eat pizza every day','eat burgers every day'],['be super smart','be super strong'],['live without music','live without TV'],['be 10 years older','10 years younger'],['fight 100 duck-sized horses','1 horse-sized duck'],['be famous','be rich'],['speak every language','play every instrument']];
module.exports={name:'wouldrather',aliases:['wouldyourather','wyr'],category:'fun',desc:'ᴡᴏᴜʟᴅ ʏᴏᴜ ʀᴀᴛʜᴇʀ',usage:'†wouldrather',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,q=W[Math.floor(Math.random()*W.length)];
        await ctx.reply(`🤔 *ᴡᴏᴜʟᴅ ʏᴏᴜ ʀᴀᴛʜᴇʀ?*\n\n🅰️ ${q[0]}\n\n🅱️ ${q[1]}${s.FOOTER}`);}};

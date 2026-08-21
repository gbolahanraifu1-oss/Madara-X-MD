'use strict';
const R=[{q:'I speak without a mouth and hear without ears. What am I?',a:'An echo'},
{q:'The more you take, the more you leave behind. What am I?',a:'Footsteps'},
{q:'I have cities but no houses, mountains but no trees. What am I?',a:'A map'},
{q:'What has hands but cannot clap?',a:'A clock'},
{q:'What can travel around the world while staying in a corner?',a:'A stamp'}];
module.exports={name:'riddle',aliases:['riddleme','brainteaser'],category:'fun',desc:'ɢᴇᴛ ᴀ ʀɪᴅᴅʟᴇ',usage:'†riddle',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,r=R[Math.floor(Math.random()*R.length)];
        await ctx.reply(`🧩 *ʀɪᴅᴅʟᴇ*\n\n${r.q}\n\n||${r.a}||${s.FOOTER}`);}};

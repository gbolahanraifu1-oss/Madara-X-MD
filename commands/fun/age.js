'use strict';
module.exports={name:'age',aliases:['calculateage','howold'],category:'fun',desc:'ᴄᴀʟᴄᴜʟᴀᴛᴇ ᴀɢᴇ',usage:'†age <DD/MM/YYYY>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const d=args[0];if(!d)return ctx.reply('❌ '+s.prefix+'age 15/07/2000'+s.FOOTER);
const[day,month,year]=d.split('/').map(Number);
const born=new Date(year,month-1,day),now=new Date();
let age=now.getFullYear()-born.getFullYear();
if(now<new Date(now.getFullYear(),month-1,day))age--;
const next=new Date(now.getFullYear(),month-1,day);
if(next<now)next.setFullYear(now.getFullYear()+1);
const days=Math.round((next-now)/86400000);
await ctx.reply('🎂 *ᴀɢᴇ ᴄᴀʟᴄᴜʟᴀᴛᴏʀ*\n\n🎈 ᴀɢᴇ: *'+age+' ʏᴇᴀʀs*\n🎉 ɴᴇxᴛ ʙᴅᴀʏ: *'+days+' ᴅᴀʏs*'+s.FOOTER);}};

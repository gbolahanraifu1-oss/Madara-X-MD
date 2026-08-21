'use strict';
const axios=require('axios');
if(!global._trivia)global._trivia=new Map();
module.exports={name:'trivia',aliases:['quiz','triva'],category:'fun',desc:'ᴘʟᴀʏ ᴛʀɪᴠɪᴀ Q̲ᴜɪᴢ',usage:'†trivia',
async execute(sock,msg,args,ctx){
const s=ctx.settings;
try{const res=await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
const q=res.data.results[0];
const correct=q.correct_answer.replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&amp;/g,'&');
const all=[...q.incorrect_answers,correct].sort(()=>Math.random()-.5).map(a=>a.replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&amp;/g,'&'));
const letters=['A','B','C','D'];
global._trivia.set(ctx.from,{answer:correct,expires:Date.now()+30000});
const opts=all.map((a,i)=>`${letters[i]}. ${a}`).join('\n');
await ctx.reply(`🧠 *ᴛʀɪᴠɪᴀ*\n\n${q.question.replace(/&quot;/g,'"').replace(/&#039;/g,"'")}\n\n${opts}\n\n_ʀᴇᴘʟʏ ᴡɪᴛʜ A/B/C/D ᴡɪᴛʜɪɴ 30s_${s.FOOTER}`);
}catch(e){await ctx.reply(`❌ ᴇʀʀᴏʀ ʟᴏᴀᴅɪɴɢ Q̲ᴜɪᴢ.${s.FOOTER}`);}
}};

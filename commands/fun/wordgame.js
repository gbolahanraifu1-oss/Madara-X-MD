'use strict';
if(!global._wordgame)global._wordgame=new Map();
const CATEGORIES={animal:['ELEPHANT','DOLPHIN','PENGUIN','CHEETAH','GORILLA'],country:['NIGERIA','JAPAN','BRAZIL','CANADA','GERMANY'],food:['SPAGHETTI','AVOCADO','CHOCOLATE','BROCCOLI','PANCAKE']};
module.exports={name:'wordgame',aliases:['scramble','wg'],category:'fun',desc:'ᴜɴsᴄʀᴀᴍʙʟᴇ ᴛʜᴇ ᴡᴏʀᴅ',usage:'†wordgame',
async execute(sock,msg,args,ctx){
const s=ctx.settings,id=ctx.from;
if(!args[0]){
const cats=Object.keys(CATEGORIES),cat=cats[Math.floor(Math.random()*cats.length)];
const words=CATEGORIES[cat],word=words[Math.floor(Math.random()*words.length)];
const scrambled=word.split('').sort(()=>Math.random()-.5).join('');
global._wordgame.set(id,{word,cat,expires:Date.now()+60000});
return ctx.reply(`🔤 *ᴡᴏʀᴅ sᴄʀᴀᴍʙʟᴇ*\n\nᴄᴀᴛᴇɢᴏʀʏ: *${cat}*\n\n\`${scrambled}\`\n\n_ʀᴇᴘʟʏ: ${s.prefix}wordgame <ᴀɴsᴡᴇʀ>_${s.FOOTER}`);}
const game=global._wordgame.get(id);
if(!game)return ctx.reply(`❌ sᴛᴀʀᴛ ᴡɪᴛʜ ${s.prefix}wordgame${s.FOOTER}`);
if(Date.now()>game.expires){global._wordgame.delete(id);return ctx.reply(`⏰ ᴛɪᴍᴇ ᴜᴘ! ᴡᴏʀᴅ ᴡᴀs *${game.word}*${s.FOOTER}`);}
if(args[0].toUpperCase()===game.word){global._wordgame.delete(id);return ctx.reply(`🎉 *ᴄᴏʀʀᴇᴄᴛ!* ᴡᴏʀᴅ ᴡᴀs *${game.word}*${s.FOOTER}`);}
await ctx.reply(`❌ ᴡʀᴏɴɢ! ᴛʀʏ ᴀɢᴀɪɴ.${s.FOOTER}`);}};

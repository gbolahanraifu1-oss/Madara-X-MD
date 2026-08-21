'use strict';
const WORDS=['NARUTO','MADARA','SASUKE','LUFFY','GOKU','ANIME','ROBLOX','PYTHON','JAVASCRIPT','DISCORD','WHATSAPP','GITHUB'];
if(!global._hangman)global._hangman=new Map();
module.exports={name:'hangman',aliases:['hm','wordguess'],category:'fun',desc:'ᴘʟᴀʏ ʜᴀɴɢᴍᴀɴ',usage:'†hangman / †hangman <letter>',
async execute(sock,msg,args,ctx){
const s=ctx.settings,id=ctx.from,g=global._hangman;
if(!args[0]||args[0]==='start'){
const word=WORDS[Math.floor(Math.random()*WORDS.length)];
g.set(id,{word,guessed:[],wrong:0});
const display=word.split('').map(()=>'_').join(' ');
return ctx.reply(`🎯 *ʜᴀɴɢᴍᴀɴ sᴛᴀʀᴛᴇᴅ!*\n\n\`${display}\`\n\nɢᴜᴇss: ${s.prefix}hangman <ʟᴇᴛᴛᴇʀ>${s.FOOTER}`);}
const game=g.get(id);
if(!game)return ctx.reply(`❌ ᴜsᴇ ${s.prefix}hangman ᴛᴏ sᴛᴀʀᴛ.${s.FOOTER}`);
const letter=args[0].toUpperCase();
if(game.guessed.includes(letter))return ctx.reply(`⚠️ ᴀʟʀᴇᴀᴅʏ ɢᴜᴇssᴇᴅ *${letter}*${s.FOOTER}`);
game.guessed.push(letter);
if(!game.word.includes(letter))game.wrong++;
const display=game.word.split('').map(c=>game.guessed.includes(c)?c:'_').join(' ');
const LIVES=6;
if(!display.includes('_')){g.delete(id);return ctx.reply(`🎉 *ʏᴏᴜ ᴡᴏɴ!* ᴡᴏʀᴅ: *${game.word}*${s.FOOTER}`);}
if(game.wrong>=LIVES){g.delete(id);return ctx.reply(`💀 *ɢᴀᴍᴇ ᴏᴠᴇʀ!* ᴡᴏʀᴅ ᴡᴀs: *${game.word}*${s.FOOTER}`);}
await ctx.reply(`🎯 \`${display}\`\n❤️ ʟɪᴠᴇs: ${LIVES-game.wrong}/${LIVES}\n📝 ɢᴜᴇssᴇᴅ: ${game.guessed.join(', ')}${s.FOOTER}`);}};

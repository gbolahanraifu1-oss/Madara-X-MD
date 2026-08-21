'use strict';
if(!global._ttt)global._ttt=new Map();
function checkWin(b,p){const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];return wins.some(([a,b2,c])=>b[a]===p&&b[b2]===p&&b[c]===p);}
function renderBoard(b){return b.map((c,i)=>c||i+1).reduce((a,c,i)=>(i%3===0?a+'\n':a)+c+'|','').slice(1).replace(/\|/g,' | ').split('\n').join('\n──────\n');}
module.exports={name:'tictactoe',aliases:['ttt','xo'],category:'fun',desc:'ᴘʟᴀʏ ᴛɪᴄ-ᴛᴀᴄ-ᴛᴏᴇ',usage:'†tictactoe / †tictactoe <1-9>',
async execute(sock,msg,args,ctx){
const s=ctx.settings,id=ctx.from;
if(!args[0]||args[0]==='start'){global._ttt.set(id,{board:Array(9).fill(null),turn:'X'});return ctx.reply(`❎⭕ *ᴛɪᴄ-ᴛᴀᴄ-ᴛᴏᴇ*\n\n${renderBoard(Array(9).fill(null))}\n\n ❎ ɪs ʏᴏᴜʀ ᴛᴜʀɴ! ᴛʏᴘᴇ ${s.prefix}tictactoe <1-9>${s.FOOTER}`);}
const game=global._ttt.get(id);
if(!game)return ctx.reply(`❌ sᴛᴀʀᴛ ᴡɪᴛʜ ${s.prefix}tictactoe${s.FOOTER}`);
const pos=parseInt(args[0])-1;
if(isNaN(pos)||pos<0||pos>8||game.board[pos])return ctx.reply(`❌ ɪɴᴠᴀʟɪᴅ ᴍᴏᴠᴇ.${s.FOOTER}`);
game.board[pos]=game.turn;
if(checkWin(game.board,game.turn)){global._ttt.delete(id);return ctx.reply(`${renderBoard(game.board)}\n\n🎉 *${game.turn} ᴡɪɴs!*${s.FOOTER}`);}
if(game.board.every(c=>c)){global._ttt.delete(id);return ctx.reply(`${renderBoard(game.board)}\n\n🤝 *ᴅʀᴀᴡ!*${s.FOOTER}`);}
const opp=game.turn==='X'?'O':'X';
const empty=game.board.map((c,i)=>c?null:i).filter(i=>i!==null);
game.board[empty[Math.floor(Math.random()*empty.length)]]=opp;
if(checkWin(game.board,opp)){global._ttt.delete(id);return ctx.reply(`${renderBoard(game.board)}\n\n🤖 *${opp} ᴡɪɴs!*${s.FOOTER}`);}
await ctx.reply(`${renderBoard(game.board)}\n\n*${game.turn} ᴛᴜʀɴ*${s.FOOTER}`);
}};

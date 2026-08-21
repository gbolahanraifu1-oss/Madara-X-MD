'use strict';
const N=['Never have I ever gone skinny dipping','Never have I ever lied to get out of trouble','Never have I ever stalked someone online','Never have I ever cried at a movie','Never have I ever eaten an entire pizza alone','Never have I ever ghosted someone','Never have I ever cheated in a game','Never have I ever sung karaoke','Never have I ever broken a bone','Never have I ever been on a blind date'];
module.exports={name:'neverhaveiever',aliases:['nhie','never'],category:'fun',desc:'ɴᴇᴠᴇʀ ʜᴀᴠᴇ ɪ ᴇᴠᴇʀ',usage:'†neverhaveiever',
    async execute(sock,msg,args,ctx){const s=ctx.settings;await ctx.reply(`🙅 *ɴᴇᴠᴇʀ ʜᴀᴠᴇ ɪ ᴇᴠᴇʀ*\n\n${N[Math.floor(Math.random()*N.length)]}${s.FOOTER}`);}};

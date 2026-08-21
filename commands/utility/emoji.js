'use strict';
module.exports={name:'emoji',aliases:['getemoji','findemoji'],category:'utility',desc:'sᴇᴀʀᴄʜ ᴇᴍᴏᴊɪ',usage:'†emoji <name>',
async execute(sock,msg,args,ctx){const s=ctx.settings;const q=(args[0]||'fire').toLowerCase();
const map={fire:'🔥',heart:'❤️',star:'⭐',smile:'😊',cry:'😢',laugh:'😂',cool:'😎',angry:'😡',love:'💕',ghost:'👻',robot:'🤖',ninja:'🥷',crown:'👑',sword:'⚔️',money:'💰'};
const result=map[q]||'❓';await ctx.reply('🔍 *'+q+'* → '+result+s.FOOTER);}};

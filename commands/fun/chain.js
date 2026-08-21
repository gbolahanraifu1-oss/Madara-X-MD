'use strict';
module.exports={name:'chain',aliases:['wordchain','chainword'],category:'fun',desc:'ᴡᴏʀᴅ ᴄʜᴀɪɴ ɢᴀᴍᴇ',usage:'†chain <word>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
if(!global._chain)global._chain={};
const gid=ctx.from,word=args[0]?.toLowerCase();
if(!word)return ctx.reply('❌ sᴛᴀʀᴛ: '+s.prefix+'chain anime\nʀᴜʟᴇ: ᴇᴀᴄʜ ᴡᴏʀᴅ ᴍᴜsᴛ sᴛᴀʀᴛ ᴡɪᴛʜ ʟᴀsᴛ ʟᴇᴛᴛᴇʀ ᴏғ ᴘʀᴇᴠɪᴏᴜs ᴡᴏʀᴅ.'+s.FOOTER);
const last=global._chain[gid];
if(last&&word[0]!==last[last.length-1])return ctx.reply('❌ ᴍᴜsᴛ sᴛᴀʀᴛ ᴡɪᴛʜ *'+last[last.length-1].toUpperCase()+'*'+s.FOOTER);
global._chain[gid]=word;
await ctx.reply('✅ *'+word+'* ✓\n_ɴᴇxᴛ ᴍᴜsᴛ sᴛᴀʀᴛ ᴡɪᴛʜ *'+word[word.length-1].toUpperCase()+'*_'+s.FOOTER);}};

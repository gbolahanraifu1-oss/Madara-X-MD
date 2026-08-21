'use strict';
module.exports={name:'resetwarn',aliases:['clearwarn','removewarn'],category:'group',desc:'ʀᴇsᴇᴛ ᴡᴀʀɴɪɴɢs',usage:'†resetwarn @user',groupOnly:true,adminOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
const jid=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
if(!jid)return ctx.reply('❌ ᴍᴇɴᴛɪᴏɴ ᴀ ᴜsᴇʀ.'+s.FOOTER);
require('../../lib/database').setUser(jid,'warns',0);
await ctx.reply('✅ ᴡᴀʀɴɪɴɢs ʀᴇsᴇᴛ ғᴏʀ @'+jid.split('@')[0]+s.FOOTER);}};

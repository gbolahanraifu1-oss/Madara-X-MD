'use strict';
module.exports={name:'warn2',aliases:['warning','gwarn'],category:'group',desc:'ᴡᴀʀɴ ᴀ ᴍᴇᴍʙᴇʀ',usage:'†warn2 @user [reason]',groupOnly:true,adminOnly:true,
async execute(sock,msg,args,ctx){const s=ctx.settings;
const jid=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
if(!jid)return ctx.reply('❌ ᴍᴇɴᴛɪᴏɴ ᴀ ᴜsᴇʀ.'+s.FOOTER);
const reason=args.slice(1).join(' ')||'ɴᴏ ʀᴇᴀsᴏɴ';
const db=require('../../lib/database');const key='warn_'+ctx.from;
const warns=(db.getUser(jid,'warns')||0)+1;db.setUser(jid,'warns',warns);
await ctx.reply('⚠️ @'+jid.split('@')[0]+' ʜᴀs ʙᴇᴇɴ ᴡᴀʀɴᴇᴅ!\n📝 ʀᴇᴀsᴏɴ: '+reason+'\n🔢 ᴡᴀʀɴs: '+warns+'/3'+s.FOOTER);
if(warns>=3){await sock.groupParticipantsUpdate(ctx.from,[jid],'remove');db.setUser(jid,'warns',0);}}};

'use strict';
module.exports={name:'setwelcome2',aliases:['customwelcome','editwelcome'],category:'system',desc:'ᴄᴜsᴛᴏᴍɪᴢᴇ ᴡᴇʟᴄᴏᴍᴇ ᴍsɢ',usage:'†setwelcome2 <message>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const text=args.join(' ');if(!text)return ctx.reply('❌ ᴇɴᴛᴇʀ ᴡᴇʟᴄᴏᴍᴇ ᴍᴇssᴀɢᴇ.\nᴜsᴇ {name} ᴀɴᴅ {group}'+s.FOOTER);
require('../../lib/database').setSession(ctx.sessionPhone||'default','customWelcome',ctx.from,text);
await ctx.reply('✅ ᴡᴇʟᴄᴏᴍᴇ ᴍsɢ sᴇᴛ!'+s.FOOTER);}};

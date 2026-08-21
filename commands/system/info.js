'use strict';
module.exports={name:'info',aliases:['botinfo','sysinfo'],category:'system',desc:'sʜᴏᴡ ʙᴏᴛ ɪɴғᴏ',usage:'†info',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const os=require('os');
await ctx.reply('🤖 *'+s.botName+'*\n\n🏷️ ᴠᴇʀsɪᴏɴ: *'+s.version+'*\n👑 ᴏᴡɴᴇʀ: *'+s.ownerName+'*\n🔑 ᴘʀᴇғɪx: *'+s.prefix+'*\n🌐 ᴍᴏᴅᴇ: *'+(s.commandMode||'ᴘᴜʙʟɪᴄ')+'*\n🖥️ ᴏs: *'+os.type()+' '+os.arch()+'*\n📦 ɴᴏᴅᴇ: *'+process.version+'*\n⏱️ ᴜᴘᴛɪᴍᴇ: *'+Math.floor(process.uptime()/3600)+'ʜ*'+s.FOOTER);}};

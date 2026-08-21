'use strict';
const R=['ɪᴛ ɪs ᴄᴇʀᴛᴀɪɴ ✅','ᴅᴇғɪɴɪᴛᴇʟʏ ʏᴇs ✅','ᴏᴜᴛʟᴏᴏᴋ ɢᴏᴏᴅ ✅','ʏᴇs ✅','sɪɢɴs ᴘᴏɪɴᴛ ᴛᴏ ʏᴇs ✅','ʀᴇᴘʟʏ ʜᴀᴢʏ, ᴛʀʏ ᴀɢᴀɪɴ 🔮','ᴀsᴋ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ 🔮','ʙᴇᴛᴛᴇʀ ɴᴏᴛ ᴛᴇʟʟ ʏᴏᴜ ɴᴏᴡ 🔮','ᴅᴏɴ\'ᴛ ᴄᴏᴜɴᴛ ᴏɴ ɪᴛ ❌','ᴍʏ ʀᴇᴘʟʏ ɪs ɴᴏ ❌','ᴠᴇʀʏ ᴅᴏᴜʙᴛғᴜʟ ❌'];
module.exports={name:'8ball',aliases:['magic8','eightball'],category:'fun',desc:'ᴀsᴋ ᴛʜᴇ ᴍᴀɢɪᴄ 8ʙᴀʟʟ',usage:'†8ball <question>',
async execute(sock,msg,args,ctx){const s=ctx.settings,q=args.join(' ');
if(!q)return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}8ball Will I win?${s.FOOTER}`);
await ctx.reply(`🎱 *ᴍᴀɢɪᴄ 8ʙᴀʟʟ*\n\n❓ ${q}\n\n🔮 ${R[Math.floor(Math.random()*R.length)]}${s.FOOTER}`);}};

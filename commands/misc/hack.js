'use strict';
const axios=require('axios');
module.exports={name:'hack',aliases:['fakedl','hackterm'],category:'misc',desc:'ᴄᴏᴏʟ ʜᴀᴄᴋɪɴɢ ᴀɴɪᴍ',usage:'†hack <target>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const t=args.join(' ')||'system';
const steps=['🔍 sᴄᴀɴɴɪɴɢ ᴘᴏʀᴛs...','🔓 ʙʏᴘᴀssɪɴɢ ғɪʀᴇᴡᴀʟʟ...','💉 ɪɴᴊᴇᴄᴛɪɴɢ ᴘᴀʏʟᴏᴀᴅ...','🗂️ ᴀᴄᴄᴇssɪɴɢ ᴅᴀᴛᴀʙᴀsᴇ...','✅ ʜᴀᴄᴋ ᴄᴏᴍᴘʟᴇᴛᴇ!'];
const m=await ctx.reply('💻 *ʜᴀᴄᴋɪɴɢ '+t.toUpperCase()+'...*\n\n'+steps[0]+s.FOOTER);
for(let i=1;i<steps.length;i++){await new Promise(r=>setTimeout(r,800));
await sock.sendMessage(ctx.from,{text:'💻 *ʜᴀᴄᴋɪɴɢ '+t.toUpperCase()+'...*\n\n'+steps.slice(0,i+1).join('\n')+s.FOOTER,edit:m.key});}}};

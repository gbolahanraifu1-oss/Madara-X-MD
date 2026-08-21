'use strict';
const axios=require('axios');
module.exports={name:'spell',aliases:['spellcheck','correct'],category:'language',desc:'ᴄʜᴇᴄᴋ sᴘᴇʟʟɪɴɢ',usage:'†spell <text>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
const q=args.join(' ');if(!q)return ctx.reply('❌ '+s.prefix+'spell recieve'+s.FOOTER);
try{const r=await require('axios').get('https://api.api-ninjas.com/v1/textcompletion?prompt=Correct+the+spelling+of:+'+encodeURIComponent(q),{headers:{'X-Api-Key':'aN4y2/kNX1lBPgFdTjQaQg==KBvFc6l9jN9rHEzL'}});
await ctx.reply('✏️ *ᴄᴏʀʀᴇᴄᴛᴇᴅ:* '+(r.data?.[0]?.text?.trim()||q)+s.FOOTER);}
catch{await ctx.reply('✏️ ɪ ᴄᴏᴜʟᴅɴ\'ᴛ ᴄʜᴇᴄᴋ sᴘᴇʟʟɪɴɢ ʀɪɢʜᴛ ɴᴏᴡ.'+s.FOOTER);}}};

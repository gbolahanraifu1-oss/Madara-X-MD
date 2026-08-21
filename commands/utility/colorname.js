'use strict';
const axios=require('axios');
module.exports={name:'colorname',aliases:['hexname','colorinfo'],category:'utility',desc:'ɢᴇᴛ ᴄᴏʟᴏʀ ɴᴀᴍᴇ ғʀᴏᴍ ʜᴇx',usage:'†colorname #FF5733',
async execute(sock,msg,args,ctx){const s=ctx.settings;const hex=(args[0]||'FF5733').replace('#','');
try{const r=await axios.get('https://www.thecolorapi.com/id?hex='+hex);
await ctx.reply('🎨 *#'+hex+'*\n\n📛 ɴᴀᴍᴇ: *'+r.data.name.value+'*\n🔴 ʀɢʙ: '+r.data.rgb.value+'\n🔵 ʜsʟ: '+r.data.hsl.value+s.FOOTER);}catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

'use strict';
const axios=require('axios');
module.exports={name:'akinator',aliases:['aki','genie'],category:'fun',desc:'ᴘʟᴀʏ ᴀᴋɪɴᴀᴛᴏʀ',usage:'†akinator',
async execute(sock,msg,args,ctx){const s=ctx.settings;
await ctx.reply(`🧞 *ᴀᴋɪɴᴀᴛᴏʀ*\n\nᴛʜɪɴᴋ ᴏғ ᴀ ᴄʜᴀʀᴀᴄᴛᴇʀ ᴀɴᴅ ɪ'ʟʟ ɢᴜᴇss ɪᴛ!\n\n_ᴠɪsɪᴛ:_ https://en.akinator.com ᴛᴏ ᴘʟᴀʏ ᴏɴʟɪɴᴇ${s.FOOTER}`);}};

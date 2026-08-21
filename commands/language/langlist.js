'use strict';
const axios=require('axios');
module.exports={name:'langlist',aliases:['languages','trlang'],category:'language',desc:'ʟɪsᴛ sᴜᴘᴘᴏʀᴛᴇᴅ ʟᴀɴɢs',usage:'†langlist',
async execute(sock,msg,args,ctx){const s=ctx.settings;
await ctx.reply('🌐 *sᴜᴘᴘᴏʀᴛᴇᴅ ʟᴀɴɢᴜᴀɢᴇ ᴄᴏᴅᴇs:*\n\nen=English, fr=French, es=Spanish, de=German, it=Italian, pt=Portuguese, ru=Russian, ar=Arabic, zh=Chinese, ja=Japanese, ko=Korean, hi=Hindi, yo=Yoruba, ig=Igbo, ha=Hausa, sw=Swahili, tr=Turkish, nl=Dutch, pl=Polish\n\n_ᴜsᴇ ᴡɪᴛʜ:_ '+s.prefix+'translate2 <ᴄᴏᴅᴇ> <ᴛᴇxᴛ>'+s.FOOTER);}};

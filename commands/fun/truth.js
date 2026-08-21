'use strict';
const axios=require('axios');
const T=['Would you kiss your best friend?','What is your biggest fear?','Have you ever lied to your parents?','What is your most embarrassing moment?','Do you have a crush right now?','Have you ever cheated on a test?','What is your biggest secret?','Have you ever stolen anything?','Who was your first crush?','Have you ever been rejected?'];
module.exports={name:'truth',aliases:['truthq','asktruth'],category:'fun',desc:'ɢᴇᴛ ᴀ ᴛʀᴜᴛʜ Q̲ᴜᴇsᴛɪᴏɴ',usage:'†truth',
    async execute(sock,msg,args,ctx){const s=ctx.settings;await ctx.reply(`🤔 *ᴛʀᴜᴛʜ*\n\n${T[Math.floor(Math.random()*T.length)]}${s.FOOTER}`);}};

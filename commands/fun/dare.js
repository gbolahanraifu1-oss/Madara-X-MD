'use strict';
const D=['Sing a song out loud','Do 20 pushups right now','Send a funny selfie','Call someone and sing happy birthday','Speak in an accent for the next 5 mins','Post an embarrassing photo','Do your best dance move','Imitate someone in the group','Tell a joke','Let someone post as you for 1 message'];
module.exports={name:'dare',aliases:['dareq','askdare'],category:'fun',desc:'ɢᴇᴛ ᴀ ᴅᴀʀᴇ ᴄʜᴀʟʟᴇɴɢᴇ',usage:'†dare',
    async execute(sock,msg,args,ctx){const s=ctx.settings;await ctx.reply(`😈 *ᴅᴀʀᴇ*\n\n${D[Math.floor(Math.random()*D.length)]}${s.FOOTER}`);}};

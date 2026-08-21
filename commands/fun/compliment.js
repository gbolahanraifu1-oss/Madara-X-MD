'use strict';
const C=['You have an amazing smile that lights up the room!','Your kindness is genuinely inspiring.','You are more capable than you realize.','The world is a better place with you in it.','You have an incredible sense of humor!','Your creativity is truly one of a kind.','You are doing an amazing job at life.','You have such a positive energy!','People love spending time with you.','You are braver than you believe.'];
module.exports={name:'compliment',aliases:['comp','praise','flatter'],category:'fun',desc:'sᴇɴᴅ ᴀ ᴄᴏᴍᴘʟɪᴍᴇɴᴛ',usage:'†compliment',
    async execute(sock,msg,args,ctx){const s=ctx.settings;await ctx.reply(`🌸 *ᴄᴏᴍᴘʟɪᴍᴇɴᴛ*\n\n${C[Math.floor(Math.random()*C.length)]}${s.FOOTER}`);}};

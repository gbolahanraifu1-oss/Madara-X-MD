'use strict';
module.exports={name:'ship',aliases:['lovecalc','couple'],category:'fun',desc:'sʜɪᴘ ᴛᴡᴏ ᴘᴇᴏᴘʟᴇ',usage:'†ship @user1 @user2',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings;
        const mentions=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid||[];
        const u1=mentions[0]?.split('@')[0]||ctx.sender.split('@')[0];
        const u2=mentions[1]?.split('@')[0]||args[0]||'unknown';
        const pct=Math.floor(Math.random()*101);
        const bar='█'.repeat(Math.floor(pct/10))+'░'.repeat(10-Math.floor(pct/10));
        const emoji=pct>80?'💘':pct>60?'❤️':pct>40?'💛':pct>20?'💔':'🖤';
        await ctx.reply(`${emoji} *sʜɪᴘ ᴄᴀʟᴄᴜʟᴀᴛᴏʀ*\n\n@${u1} + @${u2}\n\n[${bar}] *${pct}%*\n\n${pct>80?'ᴘᴇʀғᴇᴄᴛ ᴍᴀᴛᴄʜ!':pct>60?'ɢʀᴇᴀᴛ ᴄᴏᴜᴘʟᴇ!':pct>40?'ᴄᴏᴜʟᴅ ᴡᴏʀᴋ...':pct>20?'ᴏᴜᴄʜ...':'ɴᴏᴛ ᴍᴇᴀɴᴛ ᴛᴏ ʙᴇ.'}${s.FOOTER}`);}};

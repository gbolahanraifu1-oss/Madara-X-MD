'use strict';
const axios=require('axios');
module.exports = {
    name:'github',aliases:['ghinfo','gh'],category:'search',desc:'sᴇᴀʀᴄʜ ɢɪᴛʜᴜʙ ᴜsᴇʀ/ʀᴇᴘᴏ',usage:'†github <user>',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,q=args.join('/');
        if(!q)return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}github torvalds${s.FOOTER}`);
        try{
            const res=await axios.get(`https://api.github.com/users/${q}`);
            const d=res.data;
            await sock.sendMessage(ctx.from,{image:{url:d.avatar_url},caption:
`👤 *${d.name||d.login}*
🔗 github.com/${d.login}
📝 ${d.bio||'ɴ/ᴀ'}
🏢 ${d.company||'ɴ/ᴀ'}
📍 ${d.location||'ɴ/ᴀ'}
📦 ʀᴇᴘᴏs: *${d.public_repos}*
👥 ғᴏʟʟᴏᴡᴇʀs: *${d.followers}* | ғᴏʟʟᴏᴡɪɴɢ: *${d.following}*${s.FOOTER}`},{quoted:msg});
        }catch(e){await ctx.reply(`❌ ᴜsᴇʀ ɴᴏᴛ ғᴏᴜɴᴅ.${s.FOOTER}`);}
    }
};

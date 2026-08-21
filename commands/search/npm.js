'use strict';
const axios=require('axios');
module.exports = {
    name:'npm',aliases:['npminfo','npmpkg'],category:'search',desc:'sᴇᴀʀᴄʜ ɴᴘᴍ ᴘᴀᴄᴋᴀɢᴇ',usage:'†npm <package>',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,q=args[0];
        if(!q)return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}npm axios${s.FOOTER}`);
        try{
            const res=await axios.get(`https://registry.npmjs.org/${encodeURIComponent(q)}`);
            const d=res.data,v=d['dist-tags']?.latest,info=d.versions?.[v];
            await ctx.reply(`📦 *${d.name}*\n\n🏷️ ᴠᴇʀsɪᴏɴ: *${v}*\n📝 ${d.description||'ɴ/ᴀ'}\n👤 ᴀᴜᴛʜᴏʀ: ${d.author?.name||'ɴ/ᴀ'}\n📜 ʟɪᴄᴇɴsᴇ: ${info?.license||'ɴ/ᴀ'}\n🔗 https://npmjs.com/package/${d.name}${s.FOOTER}`);
        }catch(e){await ctx.reply(`❌ ᴘᴀᴄᴋᴀɢᴇ ɴᴏᴛ ғᴏᴜɴᴅ.${s.FOOTER}`);}
    }
};

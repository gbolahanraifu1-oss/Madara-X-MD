'use strict';
const axios = require('axios');
module.exports = {
    name:'google', aliases:['search','gsearch'],
    category:'search', desc:'ɢᴏᴏɢʟᴇ sᴇᴀʀᴄʜ', usage:'†search <query>',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings, q=args.join(' ');
        if(!q) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}search Naruto${s.FOOTER}`);
        await ctx.react('🔍');
        try {
            // DuckDuckGo instant answers (no key needed, always works)
            const r1 = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`, {timeout:8000});
            const d = r1.data;
            const abstract = d?.AbstractText;
            const relatedTopics = d?.RelatedTopics?.slice(0,5)?.map(t=>t.Text||t.Name).filter(Boolean) || [];
            if (abstract) {
                return ctx.reply(`🔍 *${q}*\n\n${abstract}\n\n${relatedTopics.length?'*ʀᴇʟᴀᴛᴇᴅ:*\n'+relatedTopics.map(t=>`• ${t}`).join('\n'):''}${s.FOOTER}`);
            }
            // Fallback: Wikipedia search
            const r2 = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`, {timeout:8000});
            if (r2.data?.extract) {
                return ctx.reply(`🔍 *${r2.data.title}*\n\n${r2.data.extract.slice(0,600)}...\n\n🔗 ${r2.data.content_urls?.desktop?.page||''}${s.FOOTER}`);
            }
            await ctx.reply(`❌ ɴᴏ ʀᴇsᴜʟᴛs ғᴏʀ *"${q}"*. ᴛʀʏ ʙᴇɪɴɢ ᴍᴏʀᴇ sᴘᴇᴄɪғɪᴄ.${s.FOOTER}`);
        } catch(e){ await ctx.reply(`❌ sᴇᴀʀᴄʜ ғᴀɪʟᴇᴅ: ${e.message}${s.FOOTER}`); }
    }
};

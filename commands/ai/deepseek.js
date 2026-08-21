'use strict';
const axios=require('axios');
module.exports = {
    name:'deepseek',aliases:['ds','dschat'],category:'ai',desc:'ᴄʜᴀᴛ ᴡɪᴛʜ ᴅᴇᴇᴘsᴇᴇᴋ ᴀɪ',usage:'†deepseek <prompt>',
    async execute(sock,msg,args,ctx){
        const s=ctx.settings,q=args.join(' ');
        if(!q)return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}deepseek What is anime?${s.FOOTER}`);
        await ctx.react('⏳');
        try{
            const res=await axios.post('https://api.deepseek.com/v1/chat/completions',
                {model:'deepseek-chat',messages:[{role:'user',content:q}],max_tokens:1000},
                {headers:{Authorization:`Bearer ${process.env.DEEPSEEK_API_KEY||''}`,ContentType:'application/json'}}
            );
            const reply=res.data?.choices?.[0]?.message?.content;
            if(!reply)throw new Error('ɴᴏ ʀᴇsᴘᴏɴsᴇ');
            await ctx.reply(`🤖 *ᴅᴇᴇᴘsᴇᴇᴋ:*\n\n${reply}${s.FOOTER}`);
        }catch(e){
            try{
                const r2=await axios.get(`https://api.dreaded.site/api/deepseek?text=${encodeURIComponent(q)}`);
                await ctx.reply(`🤖 *ᴅᴇᴇᴘsᴇᴇᴋ:*\n\n${r2.data?.result||r2.data?.message||'ɴᴏ ʀᴇsᴘᴏɴsᴇ.'}${s.FOOTER}`);
            }catch(e2){await ctx.reply(`❌ ᴅᴇᴇᴘsᴇᴇᴋ ᴜɴᴀᴠᴀɪʟᴀʙʟᴇ.${s.FOOTER}`);}
        }
    }
};

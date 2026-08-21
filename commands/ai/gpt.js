'use strict';
module.exports={name:'gpt',aliases:['chatgpt', 'openai', 'ask'],category:'ai',desc:'ᴄʜᴀᴛ ᴡɪᴛʜ ᴄʜᴀᴛɢᴘᴛ',usage:'†gpt <prompt>',
async execute(sock,msg,args,ctx){const s=ctx.settings;
        const q=args.join(' ');
        if(!q)return ctx.reply('❌ *ᴜsᴀɢᴇ:* '+s.prefix+'gpt Hello'+s.FOOTER);
        await ctx.react('⏳');
        try{const r=await require('axios').get('https://api.dreaded.site/api/chatgpt?text='+encodeURIComponent(q));
        await ctx.reply('🤖 *ɢᴘᴛ:*\n\n'+(r.data?.result||r.data?.message||'ɴᴏ ʀᴇsᴘᴏɴsᴇ.')+s.FOOTER);
        }catch(e){await ctx.reply('❌ '+e.message+s.FOOTER);}}};

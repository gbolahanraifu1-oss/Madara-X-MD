'use strict';
const axios = require('axios');
module.exports = {
    name: 'chatbot', aliases: ['chat', 'ai', 'ask'],
    category: 'misc', desc: 'ᴄʜᴀᴛ ᴡɪᴛʜ ᴀɪ',
    usage: '†chatbot <message>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args.join(' ') || ctx.getQuotedText?.();
        if (!q) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}chatbot hello!${s.FOOTER}`);
        try {
            const res = await axios.get(`https://api.simsimi.vn/v2/?text=${encodeURIComponent(q)}&lc=en`);
            await ctx.reply(`🤖 ${res.data?.success || res.data?.message || 'ɴᴏ ʀᴇsᴘᴏɴsᴇ.'}${s.FOOTER}`);
        } catch {
            try {
                const r2 = await axios.get(`https://api.dreaded.site/api/chatbot?text=${encodeURIComponent(q)}`);
                await ctx.reply(`🤖 ${r2.data?.result?.message || r2.data?.message || 'ɴᴏ ʀᴇsᴘᴏɴsᴇ.'}${s.FOOTER}`);
            } catch (e) { await ctx.reply(`❌ ᴄʜᴀᴛʙᴏᴛ ᴜɴᴀᴠᴀɪʟᴀʙʟᴇ.${s.FOOTER}`); }
        }
    }
};

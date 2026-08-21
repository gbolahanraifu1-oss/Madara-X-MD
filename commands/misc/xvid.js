'use strict';
const axios = require('axios');
module.exports = {
    name: 'xvideos', aliases: ['xvid', 'xvideo'],
    category: 'misc', desc: '🔞 xᴠɪᴅᴇᴏs sᴇᴀʀᴄʜ (18+)',
    usage: '†xvideos <query>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args.join(' ');
        if (!q) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}xvideos query${s.FOOTER}`);
        try {
            const res = await axios.get(`https://api.dreaded.site/api/xvideos?query=${encodeURIComponent(q)}`);
            const results = res.data?.result?.slice(0, 3);
            if (!results?.length) return ctx.reply(`❌ ɴᴏ ʀᴇsᴜʟᴛs.${s.FOOTER}`);
            for (const r of results) {
                await sock.sendMessage(ctx.from, {
                    image: { url: r.thumbnail }, 
                    caption: `🎥 *${r.title}*\n⏱️ ${r.duration}\n🔗 ${r.link}${s.FOOTER}`
                }, { quoted: msg });
            }
        } catch (e) { await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`); }
    }
};

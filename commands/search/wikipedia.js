'use strict';
const axios = require('axios');
module.exports = {
    name: 'wikipedia', aliases: ['wiki', 'define'],
    category: 'search', desc: 'sᴇᴀʀᴄʜ ᴡɪᴋɪᴘᴇᴅɪᴀ',
    usage: '†wiki <query>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args.join(' ');
        if (!q) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}wiki Madara Uchiha${s.FOOTER}`);
        try {
            const res = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
            const d = res.data;
            if (d.type === 'disambiguation') return ctx.reply(`⚠️ *"${q}"* ɪs ᴀᴍʙɪɢᴜᴏᴜs. ᴘʟᴇᴀsᴇ ʙᴇ ᴍᴏʀᴇ sᴘᴇᴄɪғɪᴄ.${s.FOOTER}`);
            const text = `📖 *${d.title}*\n\n${d.extract?.slice(0, 800) || 'ɴᴏ sᴜᴍᴍᴀʀʏ.'}${d.extract?.length > 800 ? '...' : ''}\n\n🔗 ${d.content_urls?.desktop?.page || ''}${s.FOOTER}`;
            if (d.thumbnail?.source) {
                await sock.sendMessage(ctx.from, { image: { url: d.thumbnail.source }, caption: text }, { quoted: msg });
            } else await ctx.reply(text);
        } catch (e) { await ctx.reply(`❌ ɴᴏᴛʜɪɴɢ ғᴏᴜɴᴅ ғᴏʀ *"${q}"*${s.FOOTER}`); }
    }
};

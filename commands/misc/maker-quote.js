'use strict';
const axios = require('axios');
module.exports = {
    name: 'makequote', aliases: ['quotegen', 'fakequote'],
    category: 'misc', desc: 'ɢᴇɴᴇʀᴀᴛᴇ ᴀ ǫᴜᴏᴛᴇ ɪᴍᴀɢᴇ',
    usage: '†makequote <text>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const text = args.join(' ');
        if (!text) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}makequote Your text here${s.FOOTER}`);
        const name = ctx.pushName || s.ownerName;
        try {
            const url = `https://api.dreaded.site/api/quotly?text=${encodeURIComponent(text)}&name=${encodeURIComponent(name)}`;
            const res = await axios.get(url, { responseType: 'arraybuffer' }).catch(async () => {
                const r2 = await axios.get(`https://some-random-api.com/canvas/quote?avatar=&username=${encodeURIComponent(name)}&quote=${encodeURIComponent(text)}`, { responseType: 'arraybuffer' });
                return r2;
            });
            await sock.sendMessage(ctx.from, { image: Buffer.from(res.data), caption: `💬${s.FOOTER}` }, { quoted: msg });
        } catch (e) { await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`); }
    }
};

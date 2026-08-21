'use strict';
const axios = require('axios');
module.exports = {
    name: 'movie', aliases: ['film', 'imdb'],
    category: 'misc', desc: 'sᴇᴀʀᴄʜ ᴍᴏᴠɪᴇ ɪɴғᴏ',
    usage: '†movie <title>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args.join(' ');
        if (!q) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}movie Naruto${s.FOOTER}`);
        try {
            const res = await axios.get(`https://www.omdbapi.com/?t=${encodeURIComponent(q)}&apikey=fc4fd0d8`);
            const m = res.data;
            if (m.Response === 'False') return ctx.reply(`❌ ᴍᴏᴠɪᴇ ɴᴏᴛ ғᴏᴜɴᴅ.${s.FOOTER}`);
            const text =
`🎬 *${m.Title}* (${m.Year})

┃ ⭐ ʀᴀᴛɪɴɢ: *${m.imdbRating}/10*
┃ 🎭 ɢᴇɴʀᴇ: *${m.Genre}*
┃ 🎥 ᴅɪʀᴇᴄᴛᴏʀ: *${m.Director}*
┃ ⏱️ ʀᴜɴᴛɪᴍᴇ: *${m.Runtime}*
┃ 🌍 ᴄᴏᴜɴᴛʀʏ: *${m.Country}*
┃ 🗣️ ʟᴀɴɢᴜᴀɢᴇ: *${m.Language}*
┃ 📅 ʀᴇʟᴇᴀsᴇᴅ: *${m.Released}*

📝 *ᴘʟᴏᴛ:* ${m.Plot}${s.FOOTER}`;
            if (m.Poster && m.Poster !== 'N/A') {
                await sock.sendMessage(ctx.from, { image: { url: m.Poster }, caption: text }, { quoted: msg });
            } else await ctx.reply(text);
        } catch (e) { await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`); }
    }
};

'use strict';
const axios = require('axios');
module.exports = {
    name: 'itunes', aliases: ['apple', 'musicinfo'],
    category: 'misc', desc: 'sᴇᴀʀᴄʜ ᴍᴜsɪᴄ ᴏɴ ɪᴛᴜɴᴇs',
    usage: '†itunes <song>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args.join(' ');
        if (!q) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}itunes Alone${s.FOOTER}`);
        try {
            const res = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=1`);
            const track = res.data?.results?.[0];
            if (!track) return ctx.reply(`❌ ɴᴏ ʀᴇsᴜʟᴛs ғᴏʀ *${q}*.${s.FOOTER}`);
            const text =
`🎵 *${track.trackName}*
👤 ${track.artistName}
💿 ${track.collectionName}
📅 ${new Date(track.releaseDate).getFullYear()}
🎼 ${track.primaryGenreName}
⏱️ ${Math.floor(track.trackTimeMillis / 60000)}:${String(Math.floor((track.trackTimeMillis % 60000) / 1000)).padStart(2,'0')}
💰 ${track.trackPrice} ${track.currency}${s.FOOTER}`;
            await sock.sendMessage(ctx.from, { image: { url: track.artworkUrl100.replace('100x100', '600x600') }, caption: text }, { quoted: msg });
        } catch (e) { await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`); }
    }
};

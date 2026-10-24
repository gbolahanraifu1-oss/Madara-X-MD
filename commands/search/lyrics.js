'use strict';
const axios = require('axios');
const { searchLyrics } = require('../../lib/apiReplacements');
module.exports = {
    name: 'lyrics', aliases: ['lyric', 'songlyrics', 'lyricsearch'],
    category: 'search', desc: 'Get song lyrics', usage: '†lyrics <song name>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = args.join(' ').trim();
        if (!q) return ctx.reply('❌ *ᴜsᴀɢᴇ:* ' + s.prefix + 'lyrics Artist - Song Title' + s.FOOTER);
        await ctx.react('🎵');
        try {
            const result = await searchLyrics(q).catch(() => null);
            if (result?.lyrics) return ctx.reply('🎵 *' + result.title + '*' + (result.artist ? '\n👤 ' + result.artist : '') + '\n\n' + result.lyrics.slice(0, 3000) + s.FOOTER);
            const parts = q.split(' ');
            const first = await axios.get('https://lyricsovh.vercel.app/v1/' + encodeURIComponent(parts[0]) + '/' + encodeURIComponent(parts.slice(1).join(' ') || q), { timeout: 8000 }).catch(() => null);
            if (first?.data?.lyrics) return ctx.reply('🎵 *' + q + '*\n\n' + first.data.lyrics.slice(0, 3000) + s.FOOTER);
            const fallback = await axios.get('https://lyrist.vercel.app/api/' + encodeURIComponent(q), { timeout: 8000 }).catch(() => null);
            if (fallback?.data?.lyrics) return ctx.reply('🎵 *' + (fallback.data.title || q) + '*\n👤 ' + (fallback.data.artist || '') + '\n\n' + fallback.data.lyrics.slice(0, 3000) + s.FOOTER);
            return ctx.reply('❌ Lyrics not found for *' + q + '*.' + s.FOOTER);
        } catch (error) { return ctx.reply('❌ Lyrics are temporarily unavailable.' + s.FOOTER); }
    },
};
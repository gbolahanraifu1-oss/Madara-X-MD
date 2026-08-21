const axios = require('axios');
module.exports = {
    name: 'lyrics',
    aliases: ['songlyrics', 'getlyrics', 'lyric'],
    category: 'media',
    desc: 'Get full song lyrics',
    usage: '†lyrics [artist - song]  or  †lyrics [song name]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const q = ctx.text;
        if (!q) return ctx.reply(`❌ Usage: \`${s.prefix}lyrics Juice WRLD - Doom\`${s.FOOTER}`);
        await ctx.react('🎵');

        let artist = '', title = q;
        if (q.includes(' - ')) { [artist, title] = q.split(' - ').map(x => x.trim()); }
        else if (q.includes(' by ')) { [title, artist] = q.split(' by ').map(x => x.trim()); }

        // If no artist given, try to find it from TheAudioDB
        if (!artist) {
            try {
                const r = await axios.get(
                    `https://www.theaudiodb.com/api/v1/json/1/searchtrack.php?q=${encodeURIComponent(title)}`,
                    { timeout: 8000 }
                );
                const track = r.data?.track?.[0];
                if (track) { artist = track.strArtist; title = track.strTrack; }
            } catch {}
        }

        let result = null;

        // API 1: lyrics.ovh (recommended, no key, fast)
        if (artist) {
            try {
                const r = await axios.get(
                    `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
                    { timeout: 10000 }
                );
                if (r.data?.lyrics?.length > 50)
                    result = { lyrics: r.data.lyrics, title, artist };
            } catch {}
        }

        // API 2: siputzx auto-detect
        if (!result) {
            try {
                const r = await axios.get(
                    `https://api.siputzx.my.id/api/s/lyrics?q=${encodeURIComponent(q)}`,
                    { timeout: 10000 }
                );
                const d = r.data?.data || r.data;
                if (d?.lyrics?.length > 50 || d?.lyric?.length > 50)
                    result = { lyrics: d.lyrics || d.lyric, title: d.title || title, artist: d.artist || artist };
            } catch {}
        }

        // API 3: some-random-api
        if (!result) {
            try {
                const r = await axios.get(
                    `https://some-random-api.com/others/lyrics?title=${encodeURIComponent(q)}`,
                    { timeout: 10000 }
                );
                if (r.data?.lyrics?.length > 50)
                    result = { lyrics: r.data.lyrics, title: r.data.title || title, artist: r.data.author || artist };
            } catch {}
        }

        // API 3.5: GiftedTech lyrics mirror
        if (!result) {
            try {
                const r = await axios.get(`https://api.giftedtech.web.id/api/search/lyrics?apikey=gifted&query=${encodeURIComponent(q)}`, { timeout: 10000 });
                const d = r.data?.result;
                if (d?.lyrics?.length > 50) result = { lyrics: d.lyrics, title: d.title || title, artist: d.artist || artist };
            } catch {}
        }

        // API 4: AI generation fallback
        if (!result) {
            try {
                const r = await axios.get(
                    `https://api.siputzx.my.id/api/ai/llama?text=${encodeURIComponent(
                        `Write the complete lyrics for "${q}". Include all verses, chorus, bridge with section labels like [Verse 1], [Chorus].`
                    )}`, { timeout: 20000 }
                );
                const lyr = r.data?.data || r.data?.result;
                if (lyr?.length > 50)
                    result = { lyrics: lyr, title: q, artist: 'AI Generated' };
            } catch {}
        }

        if (!result?.lyrics)
            return ctx.reply(`❌ Lyrics not found for *${q}*.\n_Try: \`${s.prefix}lyrics Artist - Song Title\`_${s.FOOTER}`);

        const out  = result.lyrics.length > 3500 ? result.lyrics.slice(0, 3500) + '\n\n_...truncated_' : result.lyrics;
        const note = result.artist === 'AI Generated' ? '\n_⚠️ AI generated_' : '';
        ctx.reply(`🎵 *${result.title}*\n_by ${result.artist}_${note}\n\n${out}${s.FOOTER}`);
    }
};

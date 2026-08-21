const axios = require('axios');
module.exports = {
    name: 'surah', aliases: ['quran','verse','ayah'], category: 'misc',
    desc: 'Get Quran surah or verse', usage: '†surah [number] or †surah [number]:[verse]',
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const inp = args[0] || '1';
        const [surahNum, ayahNum] = inp.split(':').map(Number);
        await ctx.react('📖');
        try {
            const url = ayahNum
                ? `https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/editions/quran-simple,en.sahih`
                : `https://api.alquran.cloud/v1/surah/${surahNum}/editions/quran-simple,en.sahih`;
            const res = await axios.get(url);
            if (ayahNum) {
                const ar = res.data.data[0]; const en = res.data.data[1];
                ctx.reply(`📖 *Surah ${ar.surah.englishName} — Ayah ${ayahNum}*\n\n${ar.text}\n\n_${en.text}_${s.FOOTER}`);
            } else {
                const ar = res.data.data[0]; const en = res.data.data[1];
                const ayahs = ar.ayahs.slice(0,3).map((a,i) => `${a.numberInSurah}. ${a.text}\n_${en.ayahs[i]?.text||''}_`).join('\n\n');
                ctx.reply(`📖 *Surah ${ar.ayahs[0]?.surah?.englishName} (${surahNum})*\n\n${ayahs}\n\n_Use \`${s.prefix}surah ${surahNum}:[ayah]\` for specific verse_${s.FOOTER}`);
            }
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

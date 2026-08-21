const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });

module.exports = {
    name: 'ytdl',
    aliases: ['ytv', 'ytaudio', 'youtubemp3', 'ytmp3', 'ytmp4'],
    category: 'media',
    desc: 'Download YouTube video or audio',
    usage: '†ytdl [url or song name]',
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const inp = args.join(' ');
        if (!inp) return ctx.reply(`❌ Usage: \`${s.prefix}ytdl [youtube url or song name]\`${s.FOOTER}`);

        const isAudio = ctx.rawCmd === 'yta' || ctx.rawCmd?.includes('mp3') || ctx.rawCmd === 'ytaudio';
        await ctx.react('⏳');

        try {
            let url = inp;
            if (!inp.includes('youtube.com') && !inp.includes('youtu.be')) {
                const yts = require('yt-search');
                const r   = await yts(inp);
                const top = r.videos[0];
                if (!top) return ctx.reply(`❌ No YouTube results for *${inp}*.${s.FOOTER}`);
                url = top.url;
                await ctx.reply(`🎬 Found: *${top.title}*\n⏱ ${top.timestamp}\nDownloading...${s.FOOTER}`);
            }

            const id  = Date.now();
            const ext = isAudio ? 'mp3' : 'mp4';
            const out = path.join(tmp, `${id}.${ext}`);
            const fmt = isAudio
                ? `yt-dlp -f bestaudio --extract-audio --audio-format mp3 -o "${out}" --no-playlist "${url}" 2>&1`
                : `yt-dlp -f "best[filesize<50M]/bestvideo+bestaudio" -o "${out}" --no-playlist --merge-output-format mp4 "${url}" 2>&1`;

            await new Promise((res, rej) => exec(fmt, { timeout: 120000 }, (e) => e ? rej(e) : res()));

            if (!fs.existsSync(out)) throw new Error('File not created after download.');
            const buf = fs.readFileSync(out);

            if (isAudio) {
                await sock.sendMessage(ctx.from, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: msg });
            } else {
                await sock.sendMessage(ctx.from, { video: buf, caption: `🎬 Downloaded${s.FOOTER}` }, { quoted: msg });
            }
            try { fs.unlinkSync(out); } catch {}
        } catch (e) {
            ctx.reply(`❌ Download failed: ${e.message}${s.FOOTER}`);
        }
    }
};

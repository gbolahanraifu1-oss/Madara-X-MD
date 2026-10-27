const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

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

            // Clean Shorts URL - remove si= tracking that breaks yt-dlp
            url = url.replace(/youtube\.com\/shorts\//, 'youtube.com/watch?v=').split('?si=')[0].split('&si=')[0];

            const id  = Date.now();
            const ext = isAudio ? 'mp3' : 'mp4';
            const out = path.join(tmp, `${id}.${ext}`);

            // Check if cookies.txt exists
            const cookiePath = path.join(process.cwd(), 'cookies.txt');
            const hasCookies = fs.existsSync(cookiePath);
            const cookieArg = hasCookies ? `--cookies "${cookiePath}"` : '';

            // Fixed commands with 2026 bypass
            const fmtAudio = `yt-dlp ${cookieArg} --extractor-args "youtube:player_client=android" -f bestaudio --extract-audio --audio-format mp3 -o "${out}" --no-playlist --no-warnings "${url}" 2>&1`;
            
            const fmtVideo = `yt-dlp ${cookieArg} --extractor-args "youtube:player_client=android,web" -f "bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]/best" -o "${out}" --no-playlist --merge-output-format mp4 --no-warnings "${url}" 2>&1`;

            const fmt = isAudio ? fmtAudio : fmtVideo;

            // Try with retry logic
            try {
                await execPromise(fmt, { timeout: 120000 });
            } catch (firstErr) {
                console.log('First attempt failed, trying ios client:', firstErr.message);
                // Fallback 2: ios client
                const fallback = isAudio
                    ? `yt-dlp ${cookieArg} --extractor-args "youtube:player_client=ios" -f bestaudio --extract-audio --audio-format mp3 -o "${out}" --no-playlist "${url}" 2>&1`
                    : `yt-dlp ${cookieArg} --extractor-args "youtube:player_client=ios" -f "best" -o "${out}" --no-playlist --merge-output-format mp4 "${url}" 2>&1`;
                await execPromise(fallback, { timeout: 120000 });
            }

            if (!fs.existsSync(out)) throw new Error('File not created after download. YouTube blocked it. Add cookies.txt');
            
            const stat = fs.statSync(out);
            if (stat.size < 10000) throw new Error('Downloaded file too small - likely failed');

            const buf = fs.readFileSync(out);

            if (isAudio) {
                await sock.sendMessage(ctx.from, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: msg });
            } else {
                await sock.sendMessage(ctx.from, { video: buf, caption: `🎬 Downloaded${s.FOOTER}`, mimetype: 'video/mp4' }, { quoted: msg });
            }
            try { fs.unlinkSync(out); } catch {}

        } catch (e) {
            console.error(e);
            ctx.reply(`❌ Download failed: ${e.message}\n\n💡 Fix: Add cookies.txt or run \`pip install -U yt-dlp\`${s.FOOTER}`);
        }
    }
};
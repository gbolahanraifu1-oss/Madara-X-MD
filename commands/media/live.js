module.exports = {
    name: 'live',
    aliases: ['ytlive', 'streamdl', 'livedl'],
    category: 'media',
    desc: 'Download/record a YouTube live stream segment',
    usage: '†live [youtube-live-url]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const url = args[0];
        if (!url) return ctx.reply(`❌ Provide a YouTube live stream URL.${s.FOOTER}`);
        await ctx.react('⏳');
        const { exec } = require('child_process');
        const fs = require('fs'), path = require('path');
        const tmp = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
        const out = path.join(tmp, `live_${Date.now()}.mp4`);
        try {
            await new Promise((res, rej) => exec(
                `yt-dlp -o "${out}" --live-from-start --playlist-end 1 "${url}" 2>&1`,
                (e, o) => e ? rej(new Error(o || e.message)) : res()
            ));
            if (!fs.existsSync(out)) throw new Error('Recording failed');
            await sock.sendMessage(ctx.from, { video: fs.readFileSync(out), caption: `🔴 Live Segment${s.FOOTER}` }, { quoted: msg });
            try { fs.unlinkSync(out); } catch {}
        } catch (e) { ctx.reply(`❌ Live download failed: ${e.message}${s.FOOTER}`); }
    }
};

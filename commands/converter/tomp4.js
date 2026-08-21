const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });

module.exports = {
    name: 'tomp4',
    aliases: ['converttovideo', 'tovideo'],
    category: 'converter',
    desc: 'Convert audio/gif to MP4 video',
    usage: '†tomp4 (reply to audio or gif)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let tgt = msg;
        if (ctxInfo?.quotedMessage) tgt = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        const isAud = !!(tgt.message?.audioMessage || msg.message?.audioMessage);
        const isGif = tgt.message?.videoMessage?.gifPlayback || msg.message?.videoMessage?.gifPlayback;
        if (!isAud && !isGif) return ctx.reply(`❌ Reply to an audio or GIF.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf = await downloadMediaMessage(tgt, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id = Date.now();
            const ext = isAud ? 'mp3' : 'gif';
            const inf = path.join(tmp, `${id}_in.${ext}`), outf = path.join(tmp, `${id}_out.mp4`);
            fs.writeFileSync(inf, buf);
            const cmd = isAud
                ? `ffmpeg -y -f lavfi -i color=c=black:s=1280x720 -i "${inf}" -shortest -c:v libx264 -c:a aac "${outf}"`
                : `ffmpeg -y -i "${inf}" -movflags faststart -pix_fmt yuv420p "${outf}"`;
            await new Promise((res, rej) => exec(cmd, e => e ? rej(e) : res()));
            await sock.sendMessage(ctx.from, { video: fs.readFileSync(outf), caption: `✅ Converted to MP4${s.FOOTER}` }, { quoted: msg });
            try { fs.unlinkSync(inf); fs.unlinkSync(outf); } catch {}
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'volume',
    aliases: ['vol', 'adjustvol', 'setvol'],
    category: 'converter',
    desc: 'Adjust audio volume (0.5 = half, 2 = double)',
    usage: '†volume [factor] (reply to audio/video)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const factor = parseFloat(args[0]);
        if (isNaN(factor) || factor <= 0) return ctx.reply(`❌ Usage: \`${s.prefix}volume 2\` — doubles volume${s.FOOTER}`);
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        const tmsg = target.message || {};
        const isAud = !!tmsg.audioMessage, isVid = !!tmsg.videoMessage;
        if (!isAud && !isVid) return ctx.reply(`❌ Reply to audio or video.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id = Date.now(); const ext = isVid ? 'mp4' : 'mp3';
            const inf = path.join(tmp, `${id}.${ext}`); const out = path.join(tmp, `${id}_vol.${ext}`);
            fs.writeFileSync(inf, buf);
            await new Promise((res, rej) => exec(`ffmpeg -y -i "${inf}" -filter:a "volume=${factor}" ${isVid ? '-c:v copy' : ''} "${out}"`, e => e ? rej(e) : res()));
            const result = fs.readFileSync(out);
            if (isVid) await sock.sendMessage(ctx.from, { video: result, caption: `🔊 Volume x${factor}${s.FOOTER}` }, { quoted: msg });
            else await sock.sendMessage(ctx.from, { audio: result, mimetype: 'audio/mp4', ptt: false }, { quoted: msg });
            try { fs.unlinkSync(inf); fs.unlinkSync(out); } catch {}
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

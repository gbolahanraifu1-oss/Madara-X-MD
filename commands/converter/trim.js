const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });

module.exports = {
    name: 'trim',
    aliases: ['trimvideo', 'trimaudio', 'cut'],
    category: 'converter',
    desc: 'Trim video or audio to a specific duration',
    usage: '†trim [start] [end]  e.g. †trim 0:10 0:30 (reply to video/audio)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const start = args[0] || '0';
        const end   = args[1] || '30';
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let tgt = msg;
        if (ctxInfo?.quotedMessage) tgt = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        const isVid = !!(tgt.message?.videoMessage || msg.message?.videoMessage);
        const isAud = !!(tgt.message?.audioMessage || msg.message?.audioMessage);
        if (!isVid && !isAud) return ctx.reply(`❌ Reply to a video or audio file.${s.FOOTER}`);
        await ctx.react('✂️');
        try {
            const buf = await downloadMediaMessage(tgt, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id = Date.now();
            const ext = isVid ? 'mp4' : 'mp3';
            const inf = path.join(tmp, `${id}_in.${ext}`), outf = path.join(tmp, `${id}_out.${ext}`);
            fs.writeFileSync(inf, buf);
            await new Promise((res, rej) => exec(`ffmpeg -y -i "${inf}" -ss ${start} -to ${end} -c copy "${outf}"`, e => e ? rej(e) : res()));
            const result = fs.readFileSync(outf);
            if (isVid) await sock.sendMessage(ctx.from, { video: result, caption: `✂️ Trimmed: ${start} → ${end}${s.FOOTER}` }, { quoted: msg });
            else await sock.sendMessage(ctx.from, { audio: result, mimetype: 'audio/mp4' }, { quoted: msg });
            try { fs.unlinkSync(inf); fs.unlinkSync(outf); } catch {}
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

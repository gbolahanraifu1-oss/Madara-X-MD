const { downloadMediaMessage } = require('@itsliaaa/baileys');
const fs = require('fs'), path = require('path'), { exec } = require('child_process');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'tomp3',
    aliases: ['toaudio', 'extractaudio'],
    category: 'converter',
    desc: 'Convert video to MP3 audio',
    usage: '†tomp3 (reply to video)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let tgt = msg;
        if (ctxInfo?.quotedMessage) tgt = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!tgt.message?.videoMessage && !msg.message?.videoMessage) return ctx.reply(`❌ Reply to a video.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf = await downloadMediaMessage(tgt, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id = Date.now();
            const inf = path.join(tmp, `${id}.mp4`), outf = path.join(tmp, `${id}.mp3`);
            fs.writeFileSync(inf, buf);
            await new Promise((res, rej) => exec(`ffmpeg -y -i "${inf}" -q:a 0 -map a "${outf}"`, e => e ? rej(e) : res()));
            await sock.sendMessage(ctx.from, { audio: fs.readFileSync(outf), mimetype: 'audio/mp4' }, { quoted: msg });
            fs.unlinkSync(inf); fs.unlinkSync(outf);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

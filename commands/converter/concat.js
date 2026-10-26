const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'concat',
    aliases: ['join', 'joinvideo', 'joinaudio'],
    category: 'converter',
    desc: 'Concatenate two videos/audios end-to-end',
    usage: '†concat (reply to video/audio + attach second)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        const tmsg = target.message || {}; const cmsg = msg.message || {};
        const isVid = !!(tmsg.videoMessage && cmsg.videoMessage);
        const isAud = !!(tmsg.audioMessage && cmsg.audioMessage);
        if (!isVid && !isAud) return ctx.reply(`❌ Reply to video/audio AND attach a second.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf1 = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const buf2 = await downloadMediaMessage(msg, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id = Date.now(); const ext = isVid ? 'mp4' : 'mp3';
            const in1 = path.join(tmp,`${id}_1.${ext}`), in2=path.join(tmp,`${id}_2.${ext}`);
            const lst = path.join(tmp,`${id}.txt`), out = path.join(tmp,`${id}_cat.${ext}`);
            fs.writeFileSync(in1, buf1); fs.writeFileSync(in2, buf2);
            fs.writeFileSync(lst, `file '${in1}'\nfile '${in2}'`);
            await new Promise((res, rej) => exec(`ffmpeg -y -f concat -safe 0 -i "${lst}" -c copy "${out}"`, e => e ? rej(e) : res()));
            const result = fs.readFileSync(out);
            if (isVid) await sock.sendMessage(ctx.from, { video: result, caption: `🔗 Joined${s.FOOTER}` }, { quoted: msg });
            else await sock.sendMessage(ctx.from, { audio: result, mimetype: 'audio/mp4', ptt: false }, { quoted: msg });
            try { [in1,in2,lst,out].forEach(f => fs.unlinkSync(f)); } catch {}
        } catch (e) { ctx.reply(`❌ Concat failed: ${e.message}${s.FOOTER}`); }
    }
};

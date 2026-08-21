const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'flip',
    aliases: ['flipimage', 'flipvideo', 'hflip', 'vflip'],
    category: 'converter',
    desc: 'Flip image/video horizontally (h) or vertically (v)',
    usage: '†flip [h|v] (reply to image/video)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const dir = args[0]?.toLowerCase() === 'v' ? 'vflip' : 'hflip';
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        const tmsg = target.message || {};
        const isImg = !!tmsg.imageMessage, isVid = !!tmsg.videoMessage;
        if (!isImg && !isVid) return ctx.reply(`❌ Reply to an image or video.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id = Date.now(); const ext = isImg ? 'jpg' : 'mp4';
            const inf = path.join(tmp, `${id}.${ext}`); const out = path.join(tmp, `${id}_flip.${ext}`);
            fs.writeFileSync(inf, buf);
            await new Promise((res, rej) => exec(`ffmpeg -y -i "${inf}" -vf "${dir}" ${isVid ? '-c:a copy' : ''} "${out}"`, e => e ? rej(e) : res()));
            const result = fs.readFileSync(out);
            const label = dir === 'hflip' ? '↔️ Horizontal' : '↕️ Vertical';
            if (isImg) await sock.sendMessage(ctx.from, { image: result, caption: `🔄 Flipped ${label}${s.FOOTER}` }, { quoted: msg });
            else await sock.sendMessage(ctx.from, { video: result, caption: `🔄 Flipped ${label}${s.FOOTER}` }, { quoted: msg });
            try { fs.unlinkSync(inf); fs.unlinkSync(out); } catch {}
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

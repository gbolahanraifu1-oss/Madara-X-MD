const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'caption',
    aliases: ['addcaption', 'videocaption', 'subtitle'],
    category: 'converter',
    desc: 'Add caption text to video or image',
    usage: '†caption [caption text] (reply to video/image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const text = args.join(' ');
        if (!text) return ctx.reply(`❌ Usage: \`${s.prefix}caption Your caption here\` (reply to media)${s.FOOTER}`);
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
            const inf = path.join(tmp,`${id}.${ext}`), out = path.join(tmp,`${id}_cap.${ext}`);
            fs.writeFileSync(inf, buf);
            const safe = text.replace(/\\/g,'\\\\').replace(/'/g,"'\\''" ).replace(/:/g,'\\:');
            const cmd = isImg
                ? `ffmpeg -y -i "${inf}" -vf "drawtext=text='${safe}':fontcolor=white:fontsize=40:box=1:boxcolor=black@0.7:boxborderw=8:x=(w-text_w)/2:y=h-th-10" "${out}"`
                : `ffmpeg -y -i "${inf}" -vf "drawtext=text='${safe}':fontcolor=white:fontsize=40:box=1:boxcolor=black@0.7:boxborderw=8:x=(w-text_w)/2:y=h-th-10" -c:a copy "${out}"`;
            await new Promise((res, rej) => exec(cmd, e => e ? rej(e) : res()));
            const result = fs.readFileSync(out);
            if (isImg) await sock.sendMessage(ctx.from, { image: result, caption: `💬 Caption added${s.FOOTER}` }, { quoted: msg });
            else await sock.sendMessage(ctx.from, { video: result, caption: `💬 Caption added${s.FOOTER}` }, { quoted: msg });
            try { fs.unlinkSync(inf); fs.unlinkSync(out); } catch {}
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

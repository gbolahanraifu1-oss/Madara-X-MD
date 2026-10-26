const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'stickerquality',
    aliases: ['stickerres', 'qualitysticker', 'hqsticker'],
    category: 'sticker',
    desc: 'Create sticker with adjustable quality/resolution',
    usage: '†stickerquality [256|512|1024] (reply to image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const size = [256, 512, 1024].includes(parseInt(args[0])) ? parseInt(args[0]) : 512;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!target.message?.imageMessage) return ctx.reply(`❌ Reply to an image. Use sizes: 256, 512, 1024${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id = Date.now();
            const inf = path.join(tmp,`${id}.jpg`), out = path.join(tmp,`${id}_q.webp`);
            fs.writeFileSync(inf, buf);
            await new Promise((res, rej) => exec(`ffmpeg -y -i "${inf}" -vf "scale=${size}:${size}:force_original_aspect_ratio=decrease,pad=${size}:${size}:(ow-iw)/2:(oh-ih)/2" "${out}"`, e => e ? rej(e) : res()));
            await sock.sendMessage(ctx.from, { sticker: fs.readFileSync(out) }, { quoted: msg });
            ctx.reply(`✅ Sticker at ${size}x${size}px${s.FOOTER}`);
            try { fs.unlinkSync(inf); fs.unlinkSync(out); } catch {}
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

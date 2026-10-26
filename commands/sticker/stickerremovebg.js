const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'stickerremovebg',
    aliases: ['stickernobg', 'stickerrembg', 'bgsticker'],
    category: 'sticker',
    desc: 'Create sticker with background removed',
    usage: '†stickerremovebg (reply to image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!target.message?.imageMessage) return ctx.reply(`❌ Reply to an image.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            let buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            if (s.removebgKey) {
                const FormData = require('form-data');
                const form = new FormData();
                form.append('image_file', buf, { filename: 'img.jpg' });
                form.append('size', 'auto');
                const res = await axios.post('https://api.remove.bg/v1.0/removebg', form,
                    { headers: { ...form.getHeaders(), 'X-Api-Key': s.removebgKey }, responseType: 'arraybuffer' });
                buf = Buffer.from(res.data);
            }
            const id = Date.now();
            const inf = path.join(tmp,`${id}.png`), out = path.join(tmp,`${id}.webp`);
            fs.writeFileSync(inf, buf);
            await new Promise((res, rej) => exec(`ffmpeg -y -i "${inf}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2" "${out}"`, e => e ? rej(e) : res()));
            await sock.sendMessage(ctx.from, { sticker: fs.readFileSync(out) }, { quoted: msg });
            try { fs.unlinkSync(inf); fs.unlinkSync(out); } catch {}
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

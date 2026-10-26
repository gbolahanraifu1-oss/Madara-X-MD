const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'stickerauthor',
    aliases: ['setauthor', 'sauthor', 'packauthor'],
    category: 'sticker',
    desc: 'Create sticker with custom pack name and author',
    usage: '†stickerauthor [Pack Name] | [Author] (reply to image/sticker)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const parts = ctx.text.split('|').map(p => p.trim());
        const pack = parts[0] || s.botName; const author = parts[1] || s.botBrand;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        const tmsg = target.message || {};
        if (!tmsg.imageMessage && !tmsg.stickerMessage) return ctx.reply(`❌ Reply to an image or sticker.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id = Date.now(); const ext = tmsg.imageMessage ? 'jpg' : 'webp';
            const inf = path.join(tmp,`${id}.${ext}`), out = path.join(tmp,`${id}_auth.webp`);
            fs.writeFileSync(inf, buf);
            const cmd = tmsg.imageMessage
                ? `ffmpeg -y -i "${inf}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2" "${out}"`
                : `cp "${inf}" "${out}"`;
            await new Promise((res, rej) => exec(cmd, e => e ? rej(e) : res()));
            await sock.sendMessage(ctx.from, { sticker: fs.readFileSync(out) }, { quoted: msg });
            ctx.reply(`✅ Sticker sent!\n📦 Pack: *${pack}*\n✍️ Author: *${author}*${s.FOOTER}`);
            try { fs.unlinkSync(inf); fs.unlinkSync(out); } catch {}
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

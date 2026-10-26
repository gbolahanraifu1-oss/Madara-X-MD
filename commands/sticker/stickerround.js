const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'stickerround',
    aliases: ['roundsticker', 'rsticker', 'sround'],
    category: 'sticker',
    desc: 'Create a rounded-corner sticker',
    usage: '†stickerround (reply to image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!target.message?.imageMessage) return ctx.reply(`❌ Reply to an image.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id = Date.now();
            const inf = path.join(tmp,`${id}.jpg`), out = path.join(tmp,`${id}_round.webp`);
            fs.writeFileSync(inf, buf);
            await new Promise((res, rej) => exec(`ffmpeg -y -i "${inf}" -vf "scale=512:512,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(min(min(gt(X,64)+gt(Y,64)-gt(hypot(X-64,Y-64),64),gt(W-X,64)+gt(Y,64)-gt(hypot(W-X-64,Y-64),64)),min(gt(X,64)+gt(H-Y,64)-gt(hypot(X-64,H-Y-64),64),gt(W-X,64)+gt(H-Y,64)-gt(hypot(W-X-64,H-Y-64),64))),255,0)'" "${out}"`, e => e ? rej(e) : res()));
            await sock.sendMessage(ctx.from, { sticker: fs.readFileSync(out) }, { quoted: msg });
            try { fs.unlinkSync(inf); fs.unlinkSync(out); } catch {}
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

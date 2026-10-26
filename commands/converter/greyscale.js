const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });

module.exports = {
    name: 'greyscale',
    aliases: ['grayscale', 'bw', 'blackwhite'],
    category: 'converter',
    desc: 'Convert image to grayscale/black & white',
    usage: '†greyscale (reply to image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let tgt = msg;
        if (ctxInfo?.quotedMessage) tgt = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!tgt.message?.imageMessage && !msg.message?.imageMessage) return ctx.reply(`❌ Reply to an image.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf = await downloadMediaMessage(tgt, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id = Date.now();
            const inf = path.join(tmp, `${id}_in.jpg`), outf = path.join(tmp, `${id}_out.jpg`);
            fs.writeFileSync(inf, buf);
            await new Promise((res, rej) => exec(`ffmpeg -y -i "${inf}" -vf "hue=s=0" "${outf}"`, e => e ? rej(e) : res()));
            await sock.sendMessage(ctx.from, { image: fs.readFileSync(outf), caption: s.FOOTER }, { quoted: msg });
            try { fs.unlinkSync(inf); fs.unlinkSync(outf); } catch {}
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

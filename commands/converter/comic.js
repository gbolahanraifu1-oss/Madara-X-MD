const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'comic',
    aliases: ['comicstyle', 'cartoon', 'toon'],
    category: 'converter',
    desc: 'Convert image to comic/cartoon style',
    usage: '†comic (reply to image)',
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
            const inf = path.join(tmp,`${id}.jpg`), out = path.join(tmp,`${id}_comic.jpg`);
            fs.writeFileSync(inf, buf);
            // Comic effect: edge detect + overlay
            await new Promise((res, rej) => exec(`ffmpeg -y -i "${inf}" -vf "edgedetect=low=0.1:high=0.4,negate,hue=s=2" "${out}"`, e => e ? rej(e) : res()));
            await sock.sendMessage(ctx.from, { image: fs.readFileSync(out), caption: `💥 Comic style!${s.FOOTER}` }, { quoted: msg });
            try { fs.unlinkSync(inf); fs.unlinkSync(out); } catch {}
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

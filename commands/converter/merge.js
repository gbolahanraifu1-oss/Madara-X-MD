const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'merge',
    aliases: ['mergeimage', 'combine', 'hstack'],
    category: 'converter',
    desc: 'Merge 2 images side-by-side (reply to one, attach another)',
    usage: '†merge (reply to img + attach another)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!target.message?.imageMessage || !msg.message?.imageMessage)
            return ctx.reply(`❌ Reply to an image AND attach a second image.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf1 = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const buf2 = await downloadMediaMessage(msg, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id = Date.now();
            const in1 = path.join(tmp, `${id}_1.jpg`); const in2 = path.join(tmp, `${id}_2.jpg`); const out = path.join(tmp, `${id}_merge.jpg`);
            fs.writeFileSync(in1, buf1); fs.writeFileSync(in2, buf2);
            await new Promise((res, rej) => exec(`ffmpeg -y -i "${in1}" -i "${in2}" -filter_complex "hstack" "${out}"`, e => e ? rej(e) : res()));
            await sock.sendMessage(ctx.from, { image: fs.readFileSync(out), caption: `🔗 Images merged${s.FOOTER}` }, { quoted: msg });
            try { [in1,in2,out].forEach(f => fs.unlinkSync(f)); } catch {}
        } catch (e) { ctx.reply(`❌ Merge failed: ${e.message}${s.FOOTER}`); }
    }
};

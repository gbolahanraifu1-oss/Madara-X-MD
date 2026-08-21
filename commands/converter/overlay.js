const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'overlay',
    aliases: ['imageoverlay', 'overlay2', 'blend'],
    category: 'converter',
    desc: 'Overlay one image on top of another',
    usage: '†overlay (reply to base image, attach overlay image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!target.message?.imageMessage || !msg.message?.imageMessage)
            return ctx.reply(`❌ Reply to base image AND attach overlay image.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf1 = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const buf2 = await downloadMediaMessage(msg, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id = Date.now();
            const in1 = path.join(tmp,`${id}_base.jpg`), in2 = path.join(tmp,`${id}_over.jpg`), out = path.join(tmp,`${id}_overlay.jpg`);
            fs.writeFileSync(in1, buf1); fs.writeFileSync(in2, buf2);
            await new Promise((res, rej) => exec(`ffmpeg -y -i "${in1}" -i "${in2}" -filter_complex "[1]scale=iw/3:ih/3[ov];[0][ov]overlay=main_w-overlay_w-10:10" "${out}"`, e => e ? rej(e) : res()));
            await sock.sendMessage(ctx.from, { image: fs.readFileSync(out), caption: `🖼️ Overlay applied${s.FOOTER}` }, { quoted: msg });
            try { [in1,in2,out].forEach(f => fs.unlinkSync(f)); } catch {}
        } catch (e) { ctx.reply(`❌ Overlay failed: ${e.message}${s.FOOTER}`); }
    }
};

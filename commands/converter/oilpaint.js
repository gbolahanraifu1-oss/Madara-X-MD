const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'oilpaint',
    aliases: ['oilpainting', 'painting', 'arteffect'],
    category: 'converter',
    desc: 'Apply oil painting effect to image',
    usage: '†oilpaint (reply to image)',
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
            const inf = path.join(tmp,`${id}.jpg`), out = path.join(tmp,`${id}_oil.jpg`);
            fs.writeFileSync(inf, buf);
            // Simulate oil paint: heavy blur + saturation boost
            await new Promise((res, rej) => exec(`ffmpeg -y -i "${inf}" -vf "gblur=sigma=2,eq=saturation=1.8:contrast=1.1" "${out}"`, e => e ? rej(e) : res()));
            await sock.sendMessage(ctx.from, { image: fs.readFileSync(out), caption: `🖌️ Oil painting effect${s.FOOTER}` }, { quoted: msg });
            try { fs.unlinkSync(inf); fs.unlinkSync(out); } catch {}
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'textonimage',
    aliases: ['addtext', 'textimg', 'textoverlay'],
    category: 'converter',
    desc: 'Add text overlay to an image',
    usage: '†textonimage [text] (reply to image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const text = args.join(' ');
        if (!text) return ctx.reply(`❌ Usage: \`${s.prefix}textonimage Your Text Here\` (reply to image)${s.FOOTER}`);
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!target.message?.imageMessage) return ctx.reply(`❌ Reply to an image.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id = Date.now();
            const inf = path.join(tmp, `${id}.jpg`); const out = path.join(tmp, `${id}_text.jpg`);
            fs.writeFileSync(inf, buf);
            const safe = text.replace(/\\/g,'\\\\').replace(/'/g,"'\\''" ).replace(/:/g,'\\:');
            await new Promise((res, rej) => exec(`ffmpeg -y -i "${inf}" -vf "drawtext=text='${safe}':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.5:boxborderw=10:x=(w-text_w)/2:y=h-th-20" "${out}"`, e => e ? rej(e) : res()));
            await sock.sendMessage(ctx.from, { image: fs.readFileSync(out), caption: `✍️ Text added${s.FOOTER}` }, { quoted: msg });
            try { fs.unlinkSync(inf); fs.unlinkSync(out); } catch {}
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

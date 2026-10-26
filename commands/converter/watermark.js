const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });

module.exports = {
    name: 'watermark',
    aliases: ['addwatermark', 'wm'],
    category: 'converter',
    desc: 'Add text watermark to image',
    usage: '†watermark [text] (reply to image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let tgt = msg;
        if (ctxInfo?.quotedMessage) tgt = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!tgt.message?.imageMessage && !msg.message?.imageMessage) return ctx.reply(`❌ Reply to an image.${s.FOOTER}`);
        const wmText = ctx.text || s.botName;
        await ctx.react('⏳');
        try {
            const buf = await downloadMediaMessage(tgt, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id = Date.now();
            const inf = path.join(tmp, `${id}_in.jpg`);
            const outf = path.join(tmp, `${id}_out.jpg`);
            fs.writeFileSync(inf, buf);
            const cmd = `ffmpeg -y -i "${inf}" -vf "drawtext=text='${wmText.replace(/'/g,"\\'")}':fontsize=36:fontcolor=white@0.7:x=w-tw-10:y=h-th-10:shadowcolor=black:shadowx=2:shadowy=2" "${outf}"`;
            await new Promise((res, rej) => exec(cmd, e => e ? rej(e) : res()));
            await sock.sendMessage(ctx.from, { image: fs.readFileSync(outf), caption: `✅ Watermark added: _${wmText}_${s.FOOTER}` }, { quoted: msg });
            try { fs.unlinkSync(inf); fs.unlinkSync(outf); } catch {}
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

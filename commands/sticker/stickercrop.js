const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs   = require('fs'), path = require('path');
const tmp  = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'stickercrop',
    aliases: ['cropsticker', 'stickerround', 'stickercircle'],
    category: 'sticker',
    desc: 'Crop sticker to circle or square',
    usage: '†stickercrop (reply to sticker/image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let tgt = msg;
        if (ctxInfo?.quotedMessage) tgt = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        const isCircle = ctx.rawCmd.includes('round') || ctx.rawCmd.includes('circle');
        await ctx.react('⏳');
        try {
            const buf  = await downloadMediaMessage(tgt, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id   = Date.now();
            const inf  = path.join(tmp, `${id}_in.webp`);
            const outf = path.join(tmp, `${id}_out.webp`);
            fs.writeFileSync(inf, buf);
            const filter = isCircle
                ? `scale=512:512,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte(pow(X-256,2)+pow(Y-256,2),pow(256,2)),255,0)'`
                : `scale=512:512`;
            await new Promise((res,rej) => exec(`ffmpeg -y -i "${inf}" -vf "${filter}" "${outf}"`, e=>e?rej(e):res()));
            await sock.sendMessage(ctx.from, { sticker: fs.readFileSync(outf) }, { quoted: msg });
            try { fs.unlinkSync(inf); fs.unlinkSync(outf); } catch {}
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

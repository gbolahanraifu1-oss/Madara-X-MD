const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'customsticker',
    aliases: ['csticker', 'advancedsticker', 'fancysticker'],
    category: 'sticker',
    desc: 'Advanced sticker with effects (round, blur, brightness)',
    usage: '†customsticker [round|blur|bright|sharp] (reply to image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const effect = args[0]?.toLowerCase() || 'round';
        const effects = {
            round: "scale=512:512,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(gt(hypot(X-W/2,Y-H/2),W/2-8),0,255)'",
            blur: 'scale=512:512,gblur=sigma=3',
            bright: 'scale=512:512,eq=brightness=0.15:saturation=1.3',
            sharp: 'scale=512:512,unsharp=5:5:1.5:5:5:0.0',
        };
        const vf = effects[effect];
        if (!vf) return ctx.reply(`❌ Effects: ${Object.keys(effects).join(', ')}${s.FOOTER}`);
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!target.message?.imageMessage) return ctx.reply(`❌ Reply to an image.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id = Date.now();
            const inf = path.join(tmp,`${id}.jpg`), out = path.join(tmp,`${id}_cs.webp`);
            fs.writeFileSync(inf, buf);
            await new Promise((res, rej) => exec(`ffmpeg -y -i "${inf}" -vf "${vf}" "${out}"`, e => e ? rej(e) : res()));
            await sock.sendMessage(ctx.from, { sticker: fs.readFileSync(out) }, { quoted: msg });
            try { fs.unlinkSync(inf); fs.unlinkSync(out); } catch {}
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

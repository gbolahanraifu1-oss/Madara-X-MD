const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'imgfilter',
    aliases: ['filter', 'photofilter', 'applyfilter'],
    category: 'converter',
    desc: 'Apply photo filter (sepia, vintage, cool, warm)',
    usage: '†imgfilter [sepia|vintage|cool|warm] (reply to image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const type = args[0]?.toLowerCase() || 'sepia';
        const filters = {
            sepia: 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131',
            vintage: 'curves=vintage,vignette',
            cool: 'colorbalance=ss=-0.3:ms=-0.2:hs=-0.1:sr=0.1:mr=0.1:hr=0.2',
            warm: 'colorbalance=ss=0.2:ms=0.3:hs=0.2:sr=-0.1:mr=0:hr=-0.1',
            grayscale: 'colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3',
            invert: 'negate',
        };
        const vf = filters[type];
        if (!vf) return ctx.reply(`❌ Available filters: ${Object.keys(filters).join(', ')}${s.FOOTER}`);
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!target.message?.imageMessage) return ctx.reply(`❌ Reply to an image.${s.FOOTER}`);
        await ctx.react('🎨');
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id = Date.now();
            const inf = path.join(tmp,`${id}.jpg`), out = path.join(tmp,`${id}_filt.jpg`);
            fs.writeFileSync(inf, buf);
            await new Promise((res, rej) => exec(`ffmpeg -y -i "${inf}" -vf "${vf}" "${out}"`, e => e ? rej(e) : res()));
            await sock.sendMessage(ctx.from, { image: fs.readFileSync(out), caption: `🎨 ${type} filter applied${s.FOOTER}` }, { quoted: msg });
            try { fs.unlinkSync(inf); fs.unlinkSync(out); } catch {}
        } catch (e) { ctx.reply(`❌ Filter failed: ${e.message}${s.FOOTER}`); }
    }
};

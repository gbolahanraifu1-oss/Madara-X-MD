const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });

module.exports = {
    name: 'speed',
    aliases: ['changespeed', 'slowmo', 'fastforward'],
    category: 'converter',
    desc: 'Change video/audio playback speed',
    usage: '†speed [0.5|1.5|2] (reply to video/audio)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const spd = parseFloat(args[0]) || 1.5;
        if (spd < 0.25 || spd > 4) return ctx.reply(`❌ Speed must be between 0.25 and 4.${s.FOOTER}`);
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let tgt = msg;
        if (ctxInfo?.quotedMessage) tgt = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        const isVid = !!(tgt.message?.videoMessage || msg.message?.videoMessage);
        const isAud = !!(tgt.message?.audioMessage || msg.message?.audioMessage);
        if (!isVid && !isAud) return ctx.reply(`❌ Reply to a video or audio.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf = await downloadMediaMessage(tgt, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id = Date.now();
            const ext = isVid ? 'mp4' : 'mp3';
            const inf = path.join(tmp, `${id}_in.${ext}`), outf = path.join(tmp, `${id}_out.${ext}`);
            fs.writeFileSync(inf, buf);
            const filter = isVid
                ? `[0:v]setpts=${(1/spd).toFixed(4)}*PTS[v];[0:a]atempo=${spd}[a]`
                : `atempo=${spd}`;
            const map = isVid ? `-filter_complex "${filter}" -map "[v]" -map "[a]"` : `-filter:a "${filter}"`;
            await new Promise((res, rej) => exec(`ffmpeg -y -i "${inf}" ${map} "${outf}"`, e => e ? rej(e) : res()));
            const result = fs.readFileSync(outf);
            if (isVid) await sock.sendMessage(ctx.from, { video: result, caption: `⚡ Speed: ${spd}x${s.FOOTER}` }, { quoted: msg });
            else await sock.sendMessage(ctx.from, { audio: result, mimetype: 'audio/mp4' }, { quoted: msg });
            try { fs.unlinkSync(inf); fs.unlinkSync(outf); } catch {}
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

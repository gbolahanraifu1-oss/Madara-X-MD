const { downloadMediaMessage } = require('@itsliaaa/baileys');
const fs   = require('fs');
const path = require('path');
const { exec } = require('child_process');
const tmp  = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });

module.exports = {
    name: 'toimg',
    aliases: ['stickertoimg', 'toimage'],
    category: 'converter',
    desc: 'Convert sticker to image',
    usage: '†toimg (reply to sticker)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let targetMsg = msg;
        if (ctxInfo?.quotedMessage) targetMsg = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!targetMsg.message?.stickerMessage && !msg.message?.stickerMessage) return ctx.reply(`❌ Reply to a sticker.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf = await downloadMediaMessage(targetMsg, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id = Date.now();
            const inFile = path.join(tmp, `${id}.webp`);
            const outFile = path.join(tmp, `${id}.png`);
            fs.writeFileSync(inFile, buf);
            await new Promise((res, rej) => exec(`ffmpeg -y -i "${inFile}" "${outFile}"`, e => e ? rej(e) : res()));
            await sock.sendMessage(ctx.from, { image: fs.readFileSync(outFile), caption: s.FOOTER }, { quoted: msg });
            fs.unlinkSync(inFile); fs.unlinkSync(outFile);
        } catch (e) { ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`); }
    }
};

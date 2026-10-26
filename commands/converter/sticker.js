const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs   = require('fs');
const path = require('path');
const tmp  = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });

module.exports = {
    name: 'sticker',
    aliases: ['s', 'stiker'],
    category: 'converter',
    desc: 'Create sticker from image/video/GIF',
    usage: '†sticker (reply to image/video/gif)',
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let targetMsg  = msg;
        if (ctxInfo?.quotedMessage) {
            targetMsg = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        }
        const tmsg = targetMsg.message || {};
        const isImg = !!(tmsg.imageMessage);
        const isVid = !!(tmsg.videoMessage);
        const isGif = tmsg.videoMessage?.gifPlayback;
        if (!isImg && !isVid) return ctx.reply(`❌ Reply to an image or video.${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const buf  = await downloadMediaMessage(targetMsg, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id   = Date.now();
            const inFile  = path.join(tmp, `${id}_in.${isImg ? 'jpg' : 'mp4'}`);
            const outFile = path.join(tmp, `${id}_out.webp`);
            fs.writeFileSync(inFile, buf);

            const ffCmd = isImg
                ? `ffmpeg -y -i "${inFile}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2" "${outFile}"`
                : `ffmpeg -y -i "${inFile}" -vcodec libwebp -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2,fps=15" -loop 0 -ss 0 -t 00:00:08 -preset default -an -vsync 0 "${outFile}"`;

            await new Promise((res, rej) => exec(ffCmd, e => e ? rej(e) : res()));
            const webp = fs.readFileSync(outFile);

            await sock.sendMessage(ctx.from, {
                sticker: webp,
                ...(isVid ? {} : {}),
            }, { quoted: msg });

            fs.unlinkSync(inFile);
            fs.unlinkSync(outFile);
        } catch (e) {
            ctx.reply(`❌ Failed to create sticker: ${e.message}${s.FOOTER}`);
        }
    }
};

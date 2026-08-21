const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { spawn } = require('child_process');
const { Sticker, StickerTypes } = require('../../lib/sticker');
const fs = require('fs'), path = require('path'), os = require('os');

module.exports = {
    name: 'stickeranimate',
    aliases: ['animatesticker', 'statictowebp', 'animsticker'],
    category: 'sticker',
    desc: 'Animate a static sticker (adds zoom effect)',
    usage: '†stickeranimate (reply to sticker/image)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        const tmsg = target.message || {};
        if (!tmsg.imageMessage && !tmsg.stickerMessage) return ctx.reply(`❌ Reply to an image or sticker.${s.FOOTER}`);
        await ctx.react('⏳');
        const tmp = path.join(os.tmpdir(), `anim_${Date.now()}`);
        const inf = tmp + '.jpg', mid = tmp + '_zoom.mp4';
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            fs.writeFileSync(inf, buf);

            // Zoom-in effect, rendered to an intermediate mp4 — the actual
            // sticker encoding (alpha, lossless, pack metadata) then goes
            // through the shared, fixed Sticker class instead of this
            // file's own separate ffmpeg call, same as every other sticker
            // command.
            await new Promise((res, rej) => {
                const p = spawn('ffmpeg', ['-y','-loop','1','-i',inf,'-vf',"scale=512:512,zoompan=z='min(zoom+0.05,1.2)':d=15:s=512x512,fps=10",'-t','1.5','-an',mid]);
                p.on('error', rej);
                p.on('close', code => code === 0 ? res() : rej(new Error('ffmpeg zoom ' + code)));
            });

            const sticker = new Sticker(fs.readFileSync(mid), { pack: s.botName, author: s.ownerName, type: StickerTypes.ANIMATED });
            await sock.sendMessage(ctx.from, {
                sticker: await sticker.toBuffer(),
                stickerMetadata: sticker.metadata(),
            }, { quoted: msg });
        } catch (e) {
            ctx.reply(`❌ Animate failed: ${e.message}${s.FOOTER}`);
        } finally {
            try { fs.unlinkSync(inf); } catch {}
            try { fs.unlinkSync(mid); } catch {}
        }
    }
};

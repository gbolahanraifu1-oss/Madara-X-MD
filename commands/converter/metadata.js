const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const { menuBox } = require('../../lib/menuBox');
const { toSmallCaps } = require('../../lib/smallcaps');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'metadata',
    aliases: ['mediainfo', 'fileinfo', 'exif'],
    category: 'converter',
    desc: 'View media file metadata/properties',
    usage: '†metadata (reply to any media)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        const tmsg = target.message || {};
        const isImg = !!tmsg.imageMessage, isVid = !!tmsg.videoMessage, isAud = !!tmsg.audioMessage;
        if (!isImg && !isVid && !isAud) return ctx.reply(`❌ Reply to any media file.${s.FOOTER}`);
        await ctx.react('🔍');
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id = Date.now(); const ext = isImg ? 'jpg' : isVid ? 'mp4' : 'mp3';
            const inf = path.join(tmp, `${id}.${ext}`);
            fs.writeFileSync(inf, buf);
            const info = await new Promise((res, rej) => exec(`ffprobe -v quiet -print_format json -show_format -show_streams "${inf}" 2>&1`, (e,o) => res(o)));
            const parsed = JSON.parse(info);
            const fmt = parsed.format || {};
            const stream = parsed.streams?.[0] || {};
            ctx.reply(
                menuBox('📊', toSmallCaps('metadata'), [
                    `*${toSmallCaps('type')}:* ${ext.toUpperCase()}`,
                    `*${toSmallCaps('size')}:* ${(buf.length/1024).toFixed(1)} KB`,
                    `*${toSmallCaps('duration')}:* ${parseFloat(fmt.duration||0).toFixed(2)}s`,
                    `*${toSmallCaps('codec')}:* ${stream.codec_name || 'N/A'}`,
                    `*${toSmallCaps('resolution')}:* ${stream.width||'?'}x${stream.height||'?'}`,
                    `*${toSmallCaps('bitrate')}:* ${Math.round((fmt.bit_rate||0)/1000)} kbps`,
                ]) + s.FOOTER
            );
            try { fs.unlinkSync(inf); } catch {}
        } catch (e) { ctx.reply(`❌ Metadata failed: ${e.message}${s.FOOTER}`); }
    }
};

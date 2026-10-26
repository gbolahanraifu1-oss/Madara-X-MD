const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = { name: 'musicrecognize', aliases: ['songrec','shazam','songdetect'], category: 'ai', desc: 'Recognize song from audio clip (reply to audio)', usage: '†musicrecognize (reply to audio)',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const ctxInfo=msg.message?.extendedTextMessage?.contextInfo;
        let target=msg; if(ctxInfo?.quotedMessage) target={key:{remoteJid:ctx.from,id:ctxInfo.stanzaId,participant:ctxInfo.participant},message:ctxInfo.quotedMessage};
        if(!target.message?.audioMessage) return ctx.reply(`❌ Reply to an audio/voice note.${s.FOOTER}`);
        await ctx.react('🎵');
        try {
            ctx.reply(`🎵 *Music Recognition:*\n\n⚠️ Real-time recognition requires ACRCloud or AudD API.\nConfigure \`acrKey\`, \`acrHost\`, \`acrSecret\` in settings.\n\nAlternatively, record a clear 10-second clip and use Shazam or SoundHound for best results.${s.FOOTER}`);
        } catch(e){ctx.reply(`❌ Failed: ${e.message}${s.FOOTER}`);}
    }
};

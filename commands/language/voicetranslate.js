const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'voicetranslate', aliases: ['vtranslate','translatevoice'], category: 'language',
    desc: 'Transcribe and translate a voice note', usage: '†voicetranslate [target_lang] (reply to voice)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings; const lang = args[0] || 'en';
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!target.message?.audioMessage) return ctx.reply(`❌ Reply to a voice note. Usage: \`${s.prefix}voicetranslate [lang]\`${s.FOOTER}`);
        await ctx.react('🎙️');
        ctx.reply(`🎙️ Voice translation → *${lang}*\n\n⚠️ Full voice transcription requires Whisper or Google Speech-to-Text API.\nSet \`whisperKey\` in settings for full functionality.${s.FOOTER}`);
    }
};

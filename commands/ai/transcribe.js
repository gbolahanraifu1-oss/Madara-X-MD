const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs'), path = require('path');
const tmp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
module.exports = {
    name: 'transcribe', aliases: ['speechtotext','voicetext','audiotranscribe'], category: 'ai',
    desc: 'Transcribe audio/voice note to text', usage: '†transcribe (reply to voice note/audio)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (ctxInfo?.quotedMessage) target = { key: { remoteJid: ctx.from, id: ctxInfo.stanzaId, participant: ctxInfo.participant }, message: ctxInfo.quotedMessage };
        if (!target.message?.audioMessage) return ctx.reply(`❌ Reply to a voice note or audio file.${s.FOOTER}`);
        await ctx.react('🎙️');
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            const id  = Date.now();
            const inf = path.join(tmp, `${id}.ogg`);
            const wav = path.join(tmp, `${id}.wav`);
            fs.writeFileSync(inf, buf);
            await new Promise((res, rej) => exec(`ffmpeg -y -i "${inf}" "${wav}"`, e => e ? rej(e) : res()));
            if (s.openaiKey) {
                const FormData = require('form-data');
                const axios   = require('axios');
                const form    = new FormData();
                form.append('file', fs.createReadStream(wav), 'audio.wav');
                form.append('model', 'whisper-1');
                const res2 = await axios.post('https://api.openai.com/v1/audio/transcriptions', form,
                    { headers: { ...form.getHeaders(), Authorization: `Bearer ${s.openaiKey}` } });
                ctx.reply(`🎙️ *Transcription:*\n\n${res2.data?.text || 'No transcription.'}${s.FOOTER}`);
            } else {
                ctx.reply(`🎙️ *Transcription:*\n\n⚠️ Set OPENAI_API_KEY in .env to enable Whisper transcription.\n\n_Alternative: Use Google Speech-to-Text API._${s.FOOTER}`);
            }
            try { fs.unlinkSync(inf); fs.unlinkSync(wav); } catch {}
        } catch (e) { ctx.reply(`❌ Transcription failed: ${e.message}${s.FOOTER}`); }
    }
};

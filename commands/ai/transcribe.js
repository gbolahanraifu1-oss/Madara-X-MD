'use strict';

const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { transcribeAudio } = require('../../lib/ai');

const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

module.exports = {
    name: 'transcribe',
    aliases: ['speechtotext', 'voicetext', 'audiotranscribe'],
    category: 'ai',
    desc: 'ᴛʀᴀɴsᴄʀɪʙᴇ ᴠᴏɪᴄᴇ ᴡɪᴛʜ ᴏᴘᴇɴᴀɪ',
    usage: '†transcribe (reply to voice note/audio)',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const info = msg.message?.extendedTextMessage?.contextInfo;
        let target = msg;
        if (info?.quotedMessage) {
            target = { key: { remoteJid: ctx.from, id: info.stanzaId, participant: info.participant }, message: info.quotedMessage };
        }
        if (!target.message?.audioMessage) return ctx.reply(`❌ Reply to a voice note or audio file.${s.FOOTER}`);
        await ctx.react('🎙️');
        const id = Date.now();
        const input = path.join(tempDir, `${id}.ogg`);
        const wav = path.join(tempDir, `${id}.wav`);
        try {
            const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
            fs.writeFileSync(input, buf);
            await new Promise((resolve, reject) => exec(`ffmpeg -y -i "${input}" "${wav}"`, error => error ? reject(error) : resolve()));
            const text = await transcribeAudio(wav);
            return ctx.reply(`🎙️ *Transcription:*\n\n${text || 'No transcription.'}${s.FOOTER}`);
        } catch (error) {
            return ctx.reply(`❌ ᴛʀᴀɴsᴄʀɪᴘᴛɪᴏɴ ғᴀɪʟᴇᴅ: ${error.message}${s.FOOTER}`);
        } finally {
            try { fs.unlinkSync(input); } catch {}
            try { fs.unlinkSync(wav); } catch {}
        }
    },
};
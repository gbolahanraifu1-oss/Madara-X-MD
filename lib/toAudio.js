const fs   = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const TMP = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

function toAudio(buffer, inputExt) {
    return new Promise((resolve, reject) => {
        const id  = Date.now();
        const inf = path.join(TMP, `${id}.${inputExt}`);
        const out = path.join(TMP, `${id}.mp3`);
        fs.writeFileSync(inf, buffer);
        const proc = spawn('ffmpeg', ['-y', '-i', inf, '-vn', '-ac', '2', '-b:a', '128k', '-ar', '44100', '-f', 'mp3', out]);
        proc.on('error', (e) => { try { fs.unlinkSync(inf); } catch {} reject(e); });
        proc.on('close', (code) => {
            try { fs.unlinkSync(inf); } catch {}
            if (code !== 0) return reject(new Error(`ffmpeg exit ${code}`));
            try {
                const result = fs.readFileSync(out);
                fs.unlinkSync(out);
                resolve(result);
            } catch (e) { reject(e); }
        });
    });
}

function detectAudioFormat(buffer) {
    if (!buffer || buffer.length < 12) return { mime: 'audio/mpeg', ext: 'mp3' };
    const b = buffer;
    // MP3
    if ((b[0] === 0xFF && (b[1] & 0xE0) === 0xE0) || b.slice(0,3).toString('ascii') === 'ID3')
        return { mime: 'audio/mpeg', ext: 'mp3' };
    // M4A/MP4 (ftyp box at offset 4)
    if (b.slice(4,8).toString('ascii') === 'ftyp')
        return { mime: 'audio/mp4', ext: 'm4a' };
    // OGG
    if (b.slice(0,4).toString('ascii') === 'OggS')
        return { mime: 'audio/ogg; codecs=opus', ext: 'ogg' };
    // WAV
    if (b.slice(0,4).toString('ascii') === 'RIFF')
        return { mime: 'audio/wav', ext: 'wav' };
    // Default assume mp4 container
    return { mime: 'audio/mp4', ext: 'm4a' };
}

module.exports = { toAudio, detectAudioFormat };

// Convert any audio buffer to ogg/opus for WhatsApp PTT voice notes.
// WhatsApp's voice-note player expects 48kHz mono Opus specifically —
// without forcing that, ffmpeg just keeps whatever rate the source file
// has (e.g. a 24kHz source stays 24kHz), which WhatsApp then refuses to
// play ("something is wrong with the audio file") even though the ogg/
// opus stream itself is perfectly valid audio.
function toPTT(buffer, inputExt = 'mp3') {
    return new Promise((resolve, reject) => {
        const id  = Date.now() + Math.random().toString(36).slice(2);
        const inf = path.join(TMP, `${id}.${inputExt}`);
        const out = path.join(TMP, `${id}.ogg`);
        fs.writeFileSync(inf, buffer);
        const proc = spawn('ffmpeg', [
            '-y', '-i', inf,
            '-vn', '-c:a', 'libopus',
            '-ar', '48000', '-ac', '1',
            '-b:a', '64k', '-vbr', 'on',
            '-compression_level', '10',
            '-f', 'ogg', out
        ]);
        proc.on('error', e => { try { fs.unlinkSync(inf); } catch {} reject(e); });
        proc.on('close', code => {
            try { fs.unlinkSync(inf); } catch {}
            if (code !== 0) return reject(new Error(`ffmpeg toPTT exit ${code}`));
            try {
                const result = fs.readFileSync(out);
                try { fs.unlinkSync(out); } catch {}
                resolve(result);
            } catch (e) { reject(e); }
        });
    });
}
module.exports.toPTT = toPTT;

'use strict';
const { promises: fsPromises } = require('fs');
const { join } = require('path');
const { spawn } = require('child_process');
const { writeFile, unlink, readFile } = fsPromises;
const os = require('os');

function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
    return new Promise(async (resolve, reject) => {
        const tmp  = join(os.tmpdir(), `ffmpeg_${Date.now()}_in.${ext}`);
        const out  = join(os.tmpdir(), `ffmpeg_${Date.now()}_out.${ext2}`);
        try {
            await writeFile(tmp, buffer);
            const proc = spawn('ffmpeg', ['-y', '-i', tmp, ...args, out]);
            proc.on('error', async e => { try { await unlink(tmp); } catch {} reject(e); });
            proc.on('close', async code => {
                try { await unlink(tmp); } catch {}
                if (code !== 0) return reject(new Error(`ffmpeg exit ${code}`));
                try {
                    const result = await readFile(out);
                    try { await unlink(out); } catch {}
                    resolve(result);
                } catch (e) { reject(e); }
            });
        } catch(e) { reject(e); }
    });
}

function toAudio(buffer, ext) {
    return ffmpeg(buffer, ['-vn', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on', '-compression_level', '10'], ext, 'opus');
}

function toPTT(buffer, ext) {
    return ffmpeg(buffer, ['-vn', '-c:a', 'libopus', '-b:a', '64k', '-vbr', 'on', '-compression_level', '10', '-f', 'ogg'], ext, 'ogg');
}

function toVideo(buffer, ext) {
    return ffmpeg(buffer, ['-c:v', 'libx264', '-c:a', 'aac', '-ab', '128k', '-crf', '32', '-preset', 'slow'], ext, 'mp4');
}

module.exports = { toAudio, toPTT, toVideo, ffmpeg };

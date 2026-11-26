'use strict';
/*
 * VOICESTICKER.JS — MADARA X-MD
 * Reply to a video and send .vs / .voicesticker
 * Trims to 7s max → animated WebP sticker + M4A audio → audioStickerMessage
 *
 * Dependencies: ffmpeg-static, ffprobe-static (npm install ffmpeg-static ffprobe-static)
 */

const {
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageIDV2,
    downloadContentFromMessage,
} = require('@itsliaaa/baileys');

const ffmpegPath    = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const { execFile }  = require('child_process');
const { promisify } = require('util');
const fs            = require('fs');
const os            = require('os');
const path          = require('path');
const crypto        = require('crypto');

const exec    = promisify(execFile);
const FFMPEG  = ffmpegPath;
const FFPROBE = ffprobeStatic.path;

const MAX_SECONDS  = 7;
const STEP_TIMEOUT = 120_000;

const log = (...a) => console.log('[voicesticker]', ...a);

const withTimeout = (promise, ms, label) =>
    Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out (${Math.round(ms / 1000)}s)`)), ms)
        ),
    ]);

const cleanup = (dirs) => {
    for (const d of dirs) {
        try { fs.rmSync(d, { recursive: true, force: true }); } catch {}
    }
};

// ── ffmpeg helpers ────────────────────────────────────────────────────────────

async function probe(file) {
    try {
        const { stdout } = await exec(FFPROBE, [
            '-v', 'error',
            '-show_entries', 'stream=codec_type,width,height:format=duration',
            '-of', 'json', file,
        ]);
        const j = JSON.parse(stdout);
        return {
            duration : parseFloat(j.format?.duration) || 0,
            hasAudio : (j.streams || []).some(s => s.codec_type === 'audio'),
            width    : j.streams?.find(s => s.codec_type === 'video')?.width  ?? null,
            height   : j.streams?.find(s => s.codec_type === 'video')?.height ?? null,
        };
    } catch {
        return { duration: 0, hasAudio: false, width: null, height: null };
    }
}

async function trimVideo(input, output) {
    const { duration } = await probe(input);
    const args = ['-y', '-i', input];
    if (duration > MAX_SECONDS) args.push('-t', String(MAX_SECONDS));
    args.push(
        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '96k',
        '-movflags', '+faststart', output
    );
    await exec(FFMPEG, args, { timeout: STEP_TIMEOUT });
}

async function makeAnimatedWebp(video, output) {
    await exec(FFMPEG, [
        '-y', '-i', video,
        '-vf', 'fps=10,scale=512:512:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-c:v', 'libwebp', '-quality', '70', '-an', '-loop', '0', output,
    ], { timeout: STEP_TIMEOUT });
}

async function makeM4aAudio(video, output) {
    await exec(FFMPEG, [
        '-y', '-i', video,
        '-vn', '-c:a', 'aac', '-b:a', '96k', output,
    ], { timeout: STEP_TIMEOUT });
}

async function downloadQuotedVideo(sock, ctxInfo) {
    const videoMessage = ctxInfo?.quotedMessage?.videoMessage;
    if (!videoMessage) return null;
    const stream = await downloadContentFromMessage(videoMessage, 'video', {
        reuploadRequest: sock.updateMediaMessage,
    });
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

// ── command ───────────────────────────────────────────────────────────────────

module.exports = {
    name: 'voicesticker',
    aliases: ['vs', 'vos'],
    category: 'sticker',
    desc: 'Make an animated voice sticker from a replied video (max 7s)',
    usage: '.vs (reply to a video)',
    ownerOnly: false,

    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;

        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo
                     || msg.message?.imageMessage?.contextInfo
                     || msg.message?.videoMessage?.contextInfo
                     || null;

        const hasQuotedVideo = !!ctxInfo?.quotedMessage?.videoMessage;

        if (!ctxInfo?.stanzaId || !hasQuotedVideo) {
            return ctx.reply(
                ctxInfo?.stanzaId && !hasQuotedVideo
                    ? `❌ The replied message isn't a video. Reply to a *video* with \`.vs\`${s.FOOTER}`
                    : `❌ Reply to a *video* with \`.vs\` to make a voice sticker.${s.FOOTER}`
            );
        }

        await ctx.react('⏳');

        const tmpDir      = path.join(os.tmpdir(), `vos-${crypto.randomBytes(6).toString('hex')}`);
        const rawFile     = path.join(tmpDir, 'raw.mp4');
        const trimmedFile = path.join(tmpDir, 'trimmed.mp4');
        const webpFile    = path.join(tmpDir, 'sticker.webp');
        const audioFile   = path.join(tmpDir, 'sound.m4a');

        try {
            log('1/6 downloading video…');
            const buffer = await withTimeout(downloadQuotedVideo(sock, ctxInfo), STEP_TIMEOUT, 'video download');
            if (!buffer?.length) return ctx.reply(`❌ Could not download the video.${s.FOOTER}`);

            fs.mkdirSync(tmpDir, { recursive: true });
            fs.writeFileSync(rawFile, buffer);
            log('1/6 downloaded:', buffer.length, 'bytes');

            log('2/6 trimming + scaling…');
            await withTimeout(trimVideo(rawFile, trimmedFile), STEP_TIMEOUT, 'ffmpeg trim');
            const meta = await probe(trimmedFile);
            log('2/6 duration:', meta.duration.toFixed(1), 's | audio:', meta.hasAudio ? 'yes' : 'no');

            log('3/6 generating webp…');
            await withTimeout(makeAnimatedWebp(trimmedFile, webpFile), STEP_TIMEOUT, 'webp');
            log('3/6 webp:', fs.statSync(webpFile).size, 'bytes');

            let audioBuffer = null;
            if (meta.hasAudio) {
                await withTimeout(makeM4aAudio(trimmedFile, audioFile), STEP_TIMEOUT, 'm4a');
                audioBuffer = fs.readFileSync(audioFile);
                log('3/6 m4a:', audioBuffer.length, 'bytes');
            }

            log('4/6 uploading sticker…');
            const webpBuf = fs.readFileSync(webpFile);
            const preparedSticker = await withTimeout(
                prepareWAMessageMedia(
                    { sticker: webpBuf },
                    { upload: sock.waUploadToServer, mediaTypeOverride: 'sticker' }
                ),
                STEP_TIMEOUT, 'sticker upload'
            );
            const st = preparedSticker?.stickerMessage;
            if (!st?.url) return ctx.reply(`❌ Sticker upload failed.${s.FOOTER}`);
            log('4/6 sticker uploaded');

            let audioMessage = null;
            if (audioBuffer) {
                log('5/6 uploading audio…');
                const preparedAudio = await withTimeout(
                    prepareWAMessageMedia(
                        { audio: audioBuffer, mimetype: 'audio/mp4' },
                        { upload: sock.waUploadToServer, mediaTypeOverride: 'audio' }
                    ),
                    STEP_TIMEOUT, 'audio upload'
                );
                const au = preparedAudio?.audioMessage;
                if (!au?.url) return ctx.reply(`❌ Audio upload failed.${s.FOOTER}`);
                audioMessage = {
                    url              : au.url,
                    mimetype         : 'audio/mp4',
                    fileSha256       : au.fileSha256,
                    fileLength       : au.fileLength,
                    seconds          : Math.max(1, Math.round(meta.duration)),
                    mediaKey         : au.mediaKey,
                    fileEncSha256    : au.fileEncSha256,
                    directPath       : au.directPath,
                    mediaKeyTimestamp: au.mediaKeyTimestamp,
                    contextInfo      : {
                        mediaDomainInfo: { mediaKeyDomain: 1, e2EeMediaKey: au.mediaKey },
                    },
                };
                log('5/6 audio uploaded');
            }

            log('6/6 relaying…');
            const stickerMessage = {
                url              : st.url,
                fileSha256       : st.fileSha256,
                fileEncSha256    : st.fileEncSha256,
                mediaKey         : st.mediaKey,
                mimetype         : 'image/webp',
                directPath       : st.directPath,
                mediaKeyTimestamp: st.mediaKeyTimestamp,
                height           : meta.height ?? 512,
                width            : meta.width  ?? 512,
                fileLength       : st.fileLength,
                isAnimated       : true,
                stickerSentTs    : String(Date.now()),
                isAvatar         : false,
                isAiSticker      : false,
                isLottie         : false,
                premium          : 0,
                emojis           : '⚡',
                contextInfo      : {
                    mediaDomainInfo: { mediaKeyDomain: 1, e2EeMediaKey: st.mediaKey },
                    experienceIds  : [13002],
                },
                ...(audioMessage ? { audioMessage } : {}),
            };

            const content   = audioMessage
                ? { audioStickerMessage: { message: { stickerMessage } } }
                : { stickerMessage };

            const messageId = generateMessageIDV2();
            const jid       = ctx.from;
            const waMsg     = generateWAMessageFromContent(jid, content, {
                userJid  : sock.user?.id,
                messageId,
                quoted   : {
                    key    : { remoteJid: jid, id: ctxInfo.stanzaId, fromMe: false, participant: ctxInfo.participant },
                    message: ctxInfo.quotedMessage,
                },
            });
            waMsg.message.messageContextInfo = {
                ...(waMsg.message.messageContextInfo ?? {}),
                messageSecret: crypto.randomBytes(32),
            };

            await sock.relayMessage(jid, waMsg.message, { messageId });
            log('6/6 done — format:', audioMessage ? 'audioStickerMessage' : 'stickerMessage');

            await ctx.react('✅');
        } catch (error) {
            console.error('[voicesticker] error:', error?.message ?? error);
            await ctx.react('❌');
            ctx.reply(`❌ Failed: ${error?.message ?? 'unknown error'}${s.FOOTER}`);
        } finally {
            cleanup([tmpDir]);
        }
    },
};

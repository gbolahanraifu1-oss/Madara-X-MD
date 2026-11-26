'use strict';

const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { spawn, execSync } = require('child_process');

let FFMPEG;
try {
    const staticPath = require('ffmpeg-static');
    FFMPEG = staticPath && fs.existsSync(staticPath) ? staticPath : 'ffmpeg';
} catch {
    FFMPEG = 'ffmpeg';
}

const PACK_MAX = 60;
const JOB_TTL_MS = 15 * 60 * 1000;

if (!global._telestickerJobs) global._telestickerJobs = new Map();
const jobs = global._telestickerJobs;

function extractPackName(input) {
    if (!input) return null;
    const m = String(input).match(/(?:t\.me\/addstickers\/|tg:\/\/addstickers\?set=)([A-Za-z0-9_]+)/i);
    return m ? m[1] : String(input).trim();
}

// Slice by codepoint, not UTF-16 units - stops breaking 𝗡𝗮𝗴𝗮𝘁𝗼 etc.
function safeSlice(str, n) {
    return Array.from(String(str || '')).slice(0, n).join('');
}

function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

function tmpFile(ext) {
    return path.join(os.tmpdir(), `tgs-${crypto.randomBytes(6).toString('hex')}${ext}`);
}

function tmpDir() {
    const d = path.join(os.tmpdir(), `tgs-${crypto.randomBytes(6).toString('hex')}`);
    fs.mkdirSync(d, { recursive: true });
    return d;
}

function cleanUp(...paths) {
    for (const p of paths) {
        if (!p) continue;
        try {
            const st = fs.statSync(p);
            if (st.isDirectory()) fs.rmSync(p, { recursive: true, force: true });
            else fs.unlinkSync(p);
        } catch {}
    }
}

async function dl(url) {
    const r = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 40000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    return Buffer.from(r.data);
}

/** Static WebP/PNG -> 512x512 static WebP. */
async function staticToWebp(buf) {
    return sharp(buf, { failOn: 'none' })
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 90, lossless: false, effort: 4 })
        .toBuffer();
}

/**
 * FFmpeg writes a zero RIFF length when WebP is streamed to stdout. WhatsApp
 * and ffprobe can reject that container even when its frame chunks are valid.
 */
function normalizeWebpContainer(buf) {
    if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
    if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
    const expectedSize = buf.length - 8;
    if (buf.readUInt32LE(4) === expectedSize) return buf;
    const normalized = Buffer.from(buf);
    normalized.writeUInt32LE(expectedSize >>> 0, 4);
    return normalized;
}

function hasAnimationChunks(buf) {
    let offset = 12;
    while (offset + 8 <= buf.length) {
        const chunkId = buf.toString('ascii', offset, offset + 4);
        const size = buf.readUInt32LE(offset + 4);
        if (chunkId === 'ANIM' || chunkId === 'ANMF') return true;
        if (size > buf.length - offset - 8) return false;
        offset += 8 + size + (size % 2);
    }
    return false;
}

function validateAnimatedWebp(buf) {
    const out = normalizeWebpContainer(buf);
    if (!out || out.length < 1024 || !hasAnimationChunks(out)) return null;
    return sharp(out, { animated: true }).metadata()
        .then(meta => meta.width && meta.height && (!meta.pages || meta.pages >= 2) ? out : null)
        .catch(() => null);
}

function runFfmpegToAnimatedWebp(args, inputBuf = null) {
    return new Promise((resolve) => {
        if (!FFMPEG) return resolve(null);
        let settled = false;
        const finish = val => { if (!settled) { settled = true; resolve(val); } };
        const ff = spawn(FFMPEG, args);
        const chunks = [];
        const timer = setTimeout(() => { try { ff.kill('SIGKILL'); } catch {} finish(null); }, 30000);
        ff.stdout.on('data', c => chunks.push(c));
        ff.stderr.on('data', () => {});
        ff.on('error', () => { clearTimeout(timer); finish(null); });
        ff.on('close', async code => {
            clearTimeout(timer);
            if (code !== 0 || !chunks.length) {
                console.error(`[telesticker] FFmpeg animation exit=${code}, bytes=${chunks.reduce((sum, c) => sum + c.length, 0)}`);
                return finish(null);
            }
            const output = await validateAnimatedWebp(Buffer.concat(chunks));
            if (!output) console.error('[telesticker] FFmpeg output failed animated-WebP validation');
            finish(output);
        });
        ff.stdin.on('error', () => {});
        if (inputBuf) ff.stdin.end(inputBuf);
        else ff.stdin.end();
    });
}

/** Any video/gif buffer -> animated WebP via ffmpeg stdin->stdout pipe. */
function ffmpegToAnimatedWebp(inputBuf, inputFps = 15) {
    return runFfmpegToAnimatedWebp([
        '-hide_banner', '-loglevel', 'error',
        '-i', 'pipe:0',
        '-vf', `scale=512:512:force_original_aspect_ratio=decrease,fps=${inputFps}`,
        '-vcodec', 'libwebp_anim',
        '-lossless', '0',
        '-compression_level', '6',
        '-q:v', '75',
        '-loop', '0',
        '-preset', 'default',
        '-an', '-vsync', '0',
        '-f', 'webp',
        'pipe:1',
    ], inputBuf);
}

/** PNG frames rendered from a TGS Lottie file -> animated WebP. */
function ffmpegFramesToAnimatedWebp(framesDir, inputFps = 30) {
    return runFfmpegToAnimatedWebp([
        '-hide_banner', '-loglevel', 'error',
        '-framerate', String(inputFps),
        '-i', path.join(framesDir, 'frame_%04d.png'),
        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease',
        '-vcodec', 'libwebp_anim',
        '-lossless', '0',
        '-compression_level', '6',
        '-q:v', '75',
        '-loop', '0',
        '-preset', 'default',
        '-an', '-vsync', '0',
        '-f', 'webp',
        'pipe:1',
    ]);
}

async function tgsToAnimatedWebp(buf) {
    const jsonPath = tmpFile('.json');
    const framesDir = tmpDir();
    try {
        const jsonBuf = zlib.gunzipSync(buf);
        fs.writeFileSync(jsonPath, jsonBuf);
        let fps = 30;
        try {
            const lottie = JSON.parse(jsonBuf.toString('utf8'));
            fps = Math.min(Math.max(lottie.fr || 30, 1), 30);
        } catch {}
        const pyScript = `
import sys, os
try:
    import rlottie_python as rl
    from PIL import Image
    anim = rl.LottieAnimation.from_file(sys.argv[1])
    total = anim.lottie_animation_get_totalframe()
    out = sys.argv[2]
    os.makedirs(out, exist_ok=True)
    for i in range(total):
        raw = anim.lottie_animation_render(i, width=512, height=512)
        Image.frombuffer('RGBA', (512, 512), bytes(raw), 'raw', 'BGRA').save(
            os.path.join(out, f'frame_{i:04d}.png')
        )
    print(total)
except ImportError:
    print('MISSING_RLOTTIE', file=sys.stderr)
    sys.exit(2)
except Exception as e:
    print(f'ERR:{e}', file=sys.stderr)
    sys.exit(1)
`;
        const pyPath = tmpFile('.py');
        fs.writeFileSync(pyPath, pyScript);
        let frameCount = 0;
        try {
            const out = execSync(`python3 "${pyPath}" "${jsonPath}" "${framesDir}"`, {
                timeout: 60000,
                encoding: 'utf8',
            }).trim();
            frameCount = parseInt(out, 10) || 0;
        } catch (e) {
            const stderr = (e.stderr || '').toString();
            if (stderr.includes('MISSING_RLOTTIE')) return null;
            console.error('[telesticker] tgs render error:', stderr.slice(-300));
            return null;
        } finally {
            cleanUp(pyPath);
        }
        if (frameCount === 0) return null;
        return await ffmpegFramesToAnimatedWebp(framesDir, fps);
    } catch (err) {
        console.error('[telesticker] tgsToAnimatedWebp error:', err.message);
        return null;
    } finally {
        cleanUp(jsonPath, framesDir);
    }
}

/** Build a static tray cover from the first available sticker. */
async function makePackCover(stickerItems) {
    const staticItem = stickerItems.find(item => !item.isAnimated);
    if (staticItem) return staticToWebp(staticItem.data);

    const first = stickerItems[0]?.data;
    if (!first) return null;
    try {
        return await sharp(first, { animated: true, page: 0, pages: 1, failOn: 'none' })
            .webp({ quality: 90, lossless: false, effort: 4 })
            .toBuffer();
    } catch (error) {
        console.error('[telesticker] cover frame error:', error.message);
        return null;
    }
}

async function sendOnePack(sock, msg, ctx, packName, publisher, sourceTitle, items) {
    const cover = await makePackCover(items);
    if (!cover || cover.length < 512 || cover.length > 1024 * 1024) {
        throw new Error('Could not create a valid static cover for this sticker pack');
    }

    await sock.sendMessage(ctx.from, {
        stickers: items,
        cover,
        name: safeSlice(packName, 40),
        publisher: safeSlice(publisher, 40),
        description: `Imported from Telegram pack: ${sourceTitle}`,
    }, { quoted: msg });

    return { ok: true, mode: 'pack', count: items.length };
}

module.exports = {
    name: 'telesticker',
    aliases: ['tsticker', 'tgpack'],
    category: 'sticker',
    desc: 'Telegram sticker set -> WA pack(s), split every 60',
    usage: '.telesticker <t.me/addstickers/PackName>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const token = process.env.TELEGRAM_BOT_TOKEN || process.env.TG_BOT_TOKEN || s.telegramToken;
        if (!token) return ctx.reply('Telegram bot token missing (TELEGRAM_BOT_TOKEN).' + s.FOOTER);
        const packInput = extractPackName(args[0]);
        if (!packInput) return ctx.reply('Usage: `' + s.prefix + 'telesticker <t.me/addstickers/PackName>`' + s.FOOTER);
        if (jobs.get(ctx.sender)) return ctx.reply('Pack job already running. Use `' + s.prefix + 'telestop` to cancel.' + s.FOOTER);

        jobs.set(ctx.sender, Date.now() + JOB_TTL_MS);
        await ctx.react('⏳');
        try {
            const tgApi = `https://api.telegram.org/bot${token}`;
            const tgFile = `https://api.telegram.org/file/bot${token}`;

            const res = await axios.get(`${tgApi}/getStickerSet`, {
                params: { name: packInput },
                timeout: 30000,
            });
            const set = res?.data?.result;
            if (!res?.data?.ok || !set || !set.stickers?.length) {
                jobs.delete(ctx.sender);
                return ctx.reply('Could not find that Telegram sticker pack.' + s.FOOTER);
            }

            const sourceTitle = set.title || packInput;
            const baseTitle = safeSlice(sourceTitle, 28);
            const publisher = safeSlice(s.ownerName || s.botBrand || 'MADARA X-MD', 28);
            await ctx.reply(`📦 *${baseTitle}* — ${set.stickers.length} sticker(s)\nPack size: ${PACK_MAX} each (auto-split if more)…` + s.FOOTER);

            const all = [];
            let failed = 0;
            let skipped = 0;

            for (let i = 0; i < set.stickers.length; i++) {
                if (!jobs.get(ctx.sender)) break;
                const sticker = set.stickers[i];
                try {
                    const fileRes = await axios.get(`${tgApi}/getFile`, {
                        params: { file_id: sticker.file_id },
                        timeout: 20000,
                    });
                    const filePath = fileRes?.data?.result?.file_path;
                    if (!filePath) { failed++; continue; }

                    const rawBuf = await dl(`${tgFile}/${filePath}`);
                    if (!rawBuf || rawBuf.length < 32) { failed++; continue; }

                    let webpBuf;
                    if (sticker.is_video || filePath.endsWith('.webm')) {
                        webpBuf = await ffmpegToAnimatedWebp(rawBuf);
                        if (!webpBuf) { failed++; continue; }
                    } else if (sticker.is_animated || filePath.endsWith('.tgs')) {
                        webpBuf = await tgsToAnimatedWebp(rawBuf);
                        if (!webpBuf) { skipped++; continue; }
                    } else {
                        webpBuf = await staticToWebp(rawBuf);
                        if (!webpBuf) { failed++; continue; }
                    }

                    if (!webpBuf || webpBuf.length < 1024 || webpBuf.length > 1024 * 1024) {
                        failed++;
                        continue;
                    }

                    all.push({
                        data: webpBuf,
                        isAnimated: hasAnimationChunks(webpBuf),
                        emojis: sticker.emoji ? [sticker.emoji] : ['✨'],
                        accessibilityLabel: safeSlice(sticker.emoji || `${baseTitle} sticker`, 80),
                    });
                } catch (e) {
                    console.error('[telesticker]', e.message);
                    failed++;
                }
            }

            if (!jobs.get(ctx.sender)) {
                jobs.delete(ctx.sender);
                return ctx.reply('Stopped.' + s.FOOTER);
            }
            if (!all.length) {
                jobs.delete(ctx.sender);
                return replyOrCtx(ctx, 'No convertible stickers.' + s.FOOTER);
            }

            const batches = chunk(all, PACK_MAX);
            const results = [];
            for (let b = 0; b < batches.length; b++) {
                if (!jobs.get(ctx.sender)) break;
                const label = batches.length === 1 ? baseTitle : safeSlice(`${baseTitle} (${b + 1}/${batches.length})`, 28);
                const r = await sendOnePack(sock, msg, ctx, label, publisher, sourceTitle, batches[b]);
                results.push({ label, ...r });
                await new Promise(resolve => setTimeout(resolve, 1200));
            }

            jobs.delete(ctx.sender);
            await ctx.react('✅');
            const lines = results.map((r) => `• *${r.label}* — ${r.count} (${r.mode})`);
            let summary = '✅ Done\n' + lines.join('\n');
            if (failed) summary += `\nFailed: ${failed}`;
            if (skipped) summary += `\nSkipped (.tgs): ${skipped}`;
            return ctx.reply(summary + s.FOOTER);
        } catch (e) {
            jobs.delete(ctx.sender);
            return ctx.reply('Error: ' + ((e.response && e.response.data && e.response.data.description) || e.message) + s.FOOTER);
        }
    },
};

function replyOrCtx(ctx, text) {
    return ctx.reply(text);
}

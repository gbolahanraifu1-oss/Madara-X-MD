'use strict';

const axios = require('axios');
const crypto = require('crypto');
const sharp = require('sharp');
const { Sticker, StickerTypes } = require('../../lib/sticker');

const PACK_MAX = 60;
const CONCURRENCY = 5;
const JOB_TTL_MS = 15 * 60 * 1000;
const STICKER_SIZE = 512;
const CORNER_RADIUS = 72;
const TARGET_BYTES = 100 * 1024;
const QUALITY_STEPS = [80, 65, 50, 35, 25];

if (!global._telestickerJobs) global._telestickerJobs = new Map();
const jobs = global._telestickerJobs;

const ROUND_MASK = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${STICKER_SIZE}" height="${STICKER_SIZE}">` +
    `<rect width="${STICKER_SIZE}" height="${STICKER_SIZE}" rx="${CORNER_RADIUS}" ry="${CORNER_RADIUS}" fill="#fff"/></svg>`
);

function extractPackName(input) {
    if (!input) return null;
    const m = String(input).match(/(?:t\.me\/addstickers\/|tg:\/\/addstickers\?set=)([A-Za-z0-9_]+)/i);
    return m ? m[1] : String(input).trim();
}

// Slice by codepoint, not UTF-16 units - stops breaking 𝗡𝗮𝗴𝗮𝘁𝗼 etc.
function safeSlice(str, n) {
    return Array.from(String(str || '')).slice(0, n).join('');
}

function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return crypto.randomBytes(16).toString('hex').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}

function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

async function getBaileys() {
    try { return require('@itsliaaa/baileys'); } catch {}
    try { return require('baileys'); } catch {}
    return null;
}

/**
 * Normalize converted buffer into a 512x512 rounded WebP under TARGET_BYTES.
 * Falls back to the raw buffer if sharp rejects a specific frame/format.
 */
async function polishStickerWebp(buffer) {
    try {
        const meta = await sharp(buffer, { failOn: 'none' }).metadata();
        if (!meta?.width || !meta?.height) return buffer;

        const { data, info } = await sharp(buffer, { failOn: 'none', animated: !!meta.pages && meta.pages > 1 })
            .rotate()
            .resize(STICKER_SIZE, STICKER_SIZE, { fit: 'cover', position: sharp.strategy.attention })
            .composite([{ input: ROUND_MASK, blend: 'dest-in' }])
            .raw()
            .toBuffer({ resolveWithObject: true });

        let out = null;
        for (const quality of QUALITY_STEPS) {
            out = await sharp(data, {
                raw: { width: info.width, height: info.height, channels: info.channels },
            })
                .webp({ quality, effort: 4 })
                .toBuffer();
            if (out.length <= TARGET_BYTES) break;
        }
        return (out && out.length >= 100) ? out : buffer;
    } catch {
        return buffer;
    }
}

async function sendOnePack(sock, msg, ctx, packName, publisher, items) {
    const packId = uuid().replace(/-/g, '').slice(0, 32);
    const baileys = await getBaileys();
    if (!baileys) throw new Error('Baileys module not available');
    const { prepareWAMessageMedia, generateWAMessageFromContent } = baileys;

    const cleanName = safeSlice(packName, 28);
    const cleanPublisher = safeSlice(publisher, 28);

    // Tray must be PNG 96x96 - never send WebP as .png
    const trayBuf = await sharp(items[0].buf, { failOn: 'none' })
        .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    if (!trayBuf?.length) throw new Error('tray PNG conversion failed - sharp required');

    const stickersMeta = items.map((item, i) => ({
        fileName: `${packId}_${i}.webp`,
        isAnimated: !!item.isAnimated,
        emojis: (item.emojis || ['⭐']).slice(0, 2),
        accessibilityLabel: safeSlice(`${cleanName} (${i + 1})`, 32),
        isLottie: false,
        mimetype: 'image/webp',
    }));

    const trayMedia = await prepareWAMessageMedia({ image: trayBuf }, { upload: sock.waUploadToServer });
    const im = trayMedia.imageMessage;
    if (!im?.directPath) throw new Error('tray upload fail');

    const stickerPackMessage = {
        stickerPackId: packId,
        name: cleanName,
        publisher: cleanPublisher,
        publisherPublic: cleanPublisher,
        stickers: stickersMeta,
        trayIconFileName: `${packId}.png`,
        stickerPackOrigin: 'USER_CREATED',
        stickerPackSize: items.length,
        fileLength: trayBuf.length,
        fileSha256: im.fileSha256,
        fileEncSha256: im.fileEncSha256,
        mediaKey: im.mediaKey,
        directPath: im.directPath,
        mediaKeyTimestamp: im.mediaKeyTimestamp,
        thumbnailDirectPath: im.directPath,
        thumbnailSha256: im.fileSha256,
        thumbnailEncSha256: im.fileEncSha256,
        thumbnailHeight: 96,
        thumbnailWidth: 96,
    };

    const full = generateWAMessageFromContent(ctx.from, { stickerPackMessage }, { userJid: sock.user?.id, quoted: msg });
    await sock.relayMessage(ctx.from, full.message, { messageId: full.key.id });
    return { ok: true, mode: 'relay', count: items.length };
}

async function convertTelegramStickers(stickers, token, baseTitle, publisher, senderKey) {
    const found = [];
    const seenHash = new Set();
    let cursor = 0;
    let skipped = 0;

    async function worker() {
        while (cursor < stickers.length && jobs.get(senderKey)) {
            const index = cursor++;
            const st = stickers[index];
            if (!st || st.is_animated) {
                skipped++;
                continue;
            }
            try {
                const fileRes = await axios.get('https://api.telegram.org/bot' + token + '/getFile', {
                    params: { file_id: st.file_id },
                    timeout: 20000,
                });
                const filePath = fileRes?.data?.result?.file_path;
                if (!filePath) {
                    skipped++;
                    continue;
                }
                const fileUrl = 'https://api.telegram.org/file/bot' + token + '/' + filePath;
                const type = st.is_video ? StickerTypes.ANIMATED : StickerTypes.DEFAULT;
                const stk = new Sticker(fileUrl, { pack: baseTitle, author: publisher, type });
                let buf = await stk.toBuffer();
                if (!buf || buf.length < 100) {
                    skipped++;
                    continue;
                }
                if (!st.is_video) {
                    buf = await polishStickerWebp(buf);
                }
                const hash = crypto.createHash('sha1').update(buf).digest('hex');
                if (seenHash.has(hash)) continue;
                seenHash.add(hash);

                found.push({
                    index,
                    buf,
                    emojis: st.emoji ? [safeSlice(st.emoji, 4)] : ['⭐'],
                    isAnimated: !!st.is_video,
                });
            } catch (e) {
                console.error('[telesticker]', e.message);
                skipped++;
            }
        }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    found.sort((a, b) => a.index - b.index);
    return { items: found.map(({ buf, emojis, isAnimated }) => ({ buf, emojis, isAnimated })), skipped };
}

module.exports = {
    name: 'telesticker',
    aliases: ['tsticker', 'tgpack'],
    category: 'sticker',
    desc: 'Telegram sticker set → WA pack(s), split every 60',
    usage: '.telesticker <t.me/addstickers/PackName>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const token = process.env.TELEGRAM_BOT_TOKEN || s.telegramToken;
        if (!token) return ctx.reply('Telegram bot token missing (TELEGRAM_BOT_TOKEN).' + s.FOOTER);
        const packInput = extractPackName(args[0]);
        if (!packInput) return ctx.reply('Usage: `' + s.prefix + 'telesticker <t.me/addstickers/PackName>`' + s.FOOTER);
        if (jobs.get(ctx.sender)) return ctx.reply('Pack job already running. Use `' + s.prefix + 'telestop` to cancel.' + s.FOOTER);

        jobs.set(ctx.sender, Date.now() + JOB_TTL_MS);
        await ctx.react('⏳');
        try {
            const res = await axios.get('https://api.telegram.org/bot' + token + '/getStickerSet', {
                params: { name: packInput },
                timeout: 30000,
            });
            const set = res?.data?.result;
            if (!set || !set.stickers?.length) {
                jobs.delete(ctx.sender);
                return ctx.reply('Could not find that Telegram sticker pack.' + s.FOOTER);
            }

            const baseTitle = safeSlice(set.title || packInput, 28);
            const publisher = safeSlice(s.ownerName || s.botBrand || 'MADARA X-MD', 28);
            await ctx.reply(`📦 *${baseTitle}* — ${set.stickers.length} sticker(s)\nPack size: ${PACK_MAX} each (auto-split if more)…` + s.FOOTER);

            const { items: all, skipped } = await convertTelegramStickers(
                set.stickers,
                token,
                baseTitle,
                publisher,
                ctx.sender
            );

            if (!jobs.get(ctx.sender)) {
                jobs.delete(ctx.sender);
                return ctx.reply('Stopped.' + s.FOOTER);
            }
            if (!all.length) {
                jobs.delete(ctx.sender);
                return ctx.reply('No convertible stickers.' + s.FOOTER);
            }

            const batches = chunk(all, PACK_MAX);
            const results = [];
            for (let b = 0; b < batches.length; b++) {
                if (!jobs.get(ctx.sender)) break;
                const label = batches.length === 1 ? baseTitle : safeSlice(`${baseTitle} (${b + 1}/${batches.length})`, 28);
                const r = await sendOnePack(sock, msg, ctx, label, publisher, batches[b]);
                results.push({ label, ...r });
                await new Promise(resolve => setTimeout(resolve, 1200));
            }
            jobs.delete(ctx.sender);
            await ctx.react('✅');
            const lines = results.map((r) => `• *${r.label}* — ${r.count} (${r.mode})`);
            return ctx.reply('✅ Done\n' + lines.join('\n') + (skipped ? '\nSkipped: ' + skipped : '') + s.FOOTER);
        } catch (e) {
            jobs.delete(ctx.sender);
            return ctx.reply('Error: ' + ((e.response && e.response.data && e.response.data.description) || e.message) + s.FOOTER);
        }
    },
};

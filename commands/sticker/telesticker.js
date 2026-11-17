'use strict';

const axios = require('axios');
const crypto = require('crypto');
const { Sticker, StickerTypes } = require('../../lib/sticker');

const PACK_MAX = 60;
const JOB_TTL_MS = 15 * 60 * 1000;

if (!global._telestickerJobs) global._telestickerJobs = new Map();
const jobs = global._telestickerJobs;

function extractPackName(input) {
    if (!input) return null;
    const m = String(input).match(/(?:t\.me\/addstickers\/|tg:\/\/addstickers\?set=)([A-Za-z0-9_]+)/i);
    return m ? m[1] : String(input).trim();
}
// FIX: slice by codepoint, not UTF-16 units - stops breaking 𝗡𝗮𝗴𝗮𝘁𝗼 etc
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

async function sendOnePack(sock, msg, ctx, packName, publisher, items) {
    const packId = uuid().replace(/-/g, '').slice(0, 32);
    const baileys = await getBaileys();
    const { prepareWAMessageMedia, generateWAMessageFromContent } = baileys;

    const cleanName = safeSlice(packName, 28);
    const cleanPublisher = safeSlice(publisher, 28);

    // tray must be PNG 96x96 - if sharp fails, DON'T send webp as .png
    let trayBuf = null;
    try {
        const sharp = require('sharp');
        trayBuf = await sharp(items[0].buf).resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    } catch {}
    if (!trayBuf) throw new Error('tray PNG conversion failed - sharp required');

    // FIX: no per-sticker upload. Proto strips directPath/mediaKey anyway.
    // Sticker files are fetched by client via packId + fileName.
    const stickersMeta = items.map((item, i) => ({
        fileName: `${packId}_${i}.webp`,
        isAnimated: !!item.isAnimated,
        emojis: (item.emojis || ['⭐']).slice(0, 2),
        // FIX: per-sticker label, codepoint-safe
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
        // FIX: number, not String("60")
        stickerPackSize: items.length,
        fileLength: trayBuf.length,
        fileSha256: im.fileSha256,
        fileEncSha256: im.fileEncSha256,
        mediaKey: im.mediaKey,
        directPath: im.directPath,
        mediaKeyTimestamp: im.mediaKeyTimestamp,
        // thumbnail IS the tray icon, so same hash is correct - keep it
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
            const res = await axios.get('https://api.telegram.org/bot' + token + '/getStickerSet', { params: { name: packInput }, timeout: 30000 });
            const set = res?.data?.result;
            if (!set || !set.stickers?.length) { jobs.delete(ctx.sender); return ctx.reply('Could not find that Telegram sticker pack.' + s.FOOTER); }

            const baseTitle = safeSlice(set.title || packInput, 28);
            const publisher = safeSlice(s.ownerName || s.botBrand || 'MADARA X-MD', 28);
            await ctx.reply(`📦 *${baseTitle}* — ${set.stickers.length} sticker(s)\nPack size: ${PACK_MAX} each (auto-split if more)…` + s.FOOTER);

            const all = []; let skipped = 0;
            for (let i = 0; i < set.stickers.length; i++) {
                if (!jobs.get(ctx.sender)) break;
                const st = set.stickers[i];
                if (st.is_animated) { skipped++; continue; }
                try {
                    const fileRes = await axios.get('https://api.telegram.org/bot' + token + '/getFile', { params: { file_id: st.file_id }, timeout: 20000 });
                    const filePath = fileRes?.data?.result?.file_path;
                    if (!filePath) { skipped++; continue; }
                    const fileUrl = 'https://api.telegram.org/file/bot' + token + '/' + filePath;
                    const type = st.is_video ? StickerTypes.ANIMATED : StickerTypes.DEFAULT;
                    const stk = new Sticker(fileUrl, { pack: baseTitle, author: publisher, type });
                    const buf = await stk.toBuffer();
                    if (!buf || buf.length < 100) { skipped++; continue; }
                    // FIX: Telegram st.emoji is a string, not array
                    all.push({ buf, emojis: st.emoji ? [st.emoji] : ['⭐'], isAnimated: !!st.is_video });
                } catch (e) { console.error('[telesticker]', e.message); skipped++; }
            }

            if (!jobs.get(ctx.sender)) { jobs.delete(ctx.sender); return ctx.reply('Stopped.' + s.FOOTER); }
            if (!all.length) { jobs.delete(ctx.sender); return ctx.reply('No convertible stickers.' + s.FOOTER); }

            const batches = chunk(all, PACK_MAX);
            const results = [];
            for (let b = 0; b < batches.length; b++) {
                if (!jobs.get(ctx.sender)) break;
                const label = batches.length === 1 ? baseTitle : safeSlice(`${baseTitle} (${b + 1}/${batches.length})`, 28);
                const r = await sendOnePack(sock, msg, ctx, label, publisher, batches[b]);
                results.push({ label, ...r });
                await new Promise(r => setTimeout(r, 1200));
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
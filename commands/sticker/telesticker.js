'use strict';

const axios = require('axios');
const crypto = require('crypto');
const { Sticker, StickerTypes } = require('../../lib/sticker');

const PACK_MAX = 60; // WA-style cap per pack; overflow → Pack (2), Pack (3)…
const JOB_TTL_MS = 15 * 60 * 1000;

if (!global._telestickerJobs) global._telestickerJobs = new Map();
const jobs = global._telestickerJobs;

function extractPackName(input) {
    if (!input) return null;
    const m = String(input).match(/(?:t\.me\/addstickers\/|tg:\/\/addstickers\?set=)([A-Za-z0-9_]+)/i);
    return m ? m[1] : String(input).trim();
}

function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return crypto.randomBytes(16).toString('hex').replace(
        /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
        '$1-$2-$3-$4-$5'
    );
}

function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

async function sendOnePack(sock, msg, ctx, packName, publisher, items) {
    const packId = uuid();

    // Path A — native stickerPack
    try {
        await sock.sendMessage(
            ctx.from,
            {
                stickerPack: {
                    name: packName,
                    publisher,
                    packId,
                    description: packName,
                    stickers: items.map((item) => ({
                        data: item.buf,
                        emojis: item.emojis,
                        isAnimated: item.isAnimated,
                    })),
                    cover: items[0].buf,
                },
            },
            { quoted: msg }
        );
        return { ok: true, mode: 'native', count: items.length };
    } catch (e) {
        console.warn('[telesticker] native pack fail:', e.message);
    }

    // Path B — upload + stickerPackMessage relay
    let prepareWAMessageMedia;
    let generateWAMessageFromContent;
    try {
        const b = require('@itsliaaa/baileys');
        prepareWAMessageMedia = b.prepareWAMessageMedia;
        generateWAMessageFromContent = b.generateWAMessageFromContent;
    } catch {
        try {
            const b = require('baileys');
            prepareWAMessageMedia = b.prepareWAMessageMedia;
            generateWAMessageFromContent = b.generateWAMessageFromContent;
        } catch {}
    }

    if (typeof sock.waUploadToServer === 'function' && typeof prepareWAMessageMedia === 'function') {
        const stickersMeta = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const media = await prepareWAMessageMedia(
                { sticker: item.buf },
                { upload: sock.waUploadToServer }
            );
            const sm = media.stickerMessage || {};
            stickersMeta.push({
                fileName: packId + '_' + i + '.webp',
                isAnimated: item.isAnimated,
                emojis: item.emojis,
                accessibilityLabel: packName,
                isLottie: false,
                mimetype: 'image/webp',
                directPath: sm.directPath,
                fileSha256: sm.fileSha256,
                fileEncSha256: sm.fileEncSha256,
                mediaKey: sm.mediaKey,
                fileLength: sm.fileLength,
                mediaKeyTimestamp: sm.mediaKeyTimestamp,
            });
        }

        const coverMedia = await prepareWAMessageMedia(
            { image: items[0].buf },
            { upload: sock.waUploadToServer }
        );
        const im = coverMedia.imageMessage || {};

        const stickerPackMessage = {
            stickerPackId: packId,
            name: packName,
            publisher,
            stickers: stickersMeta,
            trayIconFileName: packId + '.png',
            stickerPackOrigin: 'USER_CREATED',
            stickerPackSize: String(items.length),
            fileLength: im.fileLength,
            fileSha256: im.fileSha256,
            fileEncSha256: im.fileEncSha256,
            mediaKey: im.mediaKey,
            directPath: im.directPath,
            mediaKeyTimestamp: im.mediaKeyTimestamp,
            thumbnailDirectPath: im.directPath,
            thumbnailSha256: im.fileSha256,
            thumbnailEncSha256: im.fileEncSha256,
            thumbnailHeight: 252,
            thumbnailWidth: 252,
        };

        if (typeof generateWAMessageFromContent === 'function') {
            const full = generateWAMessageFromContent(
                ctx.from,
                { stickerPackMessage },
                { userJid: sock.user?.id, quoted: msg }
            );
            await sock.relayMessage(ctx.from, full.message, { messageId: full.key.id });
        } else {
            await sock.relayMessage(ctx.from, { stickerPackMessage }, {});
        }
        return { ok: true, mode: 'relay', count: items.length };
    }

    // Path C — shared pack EXIF, few stickers only (no spam full set)
    const preview = Math.min(5, items.length);
    for (let i = 0; i < preview; i++) {
        const stk = new Sticker(items[i].buf, { pack: packName, author: publisher });
        await sock.sendMessage(
            ctx.from,
            { sticker: await stk.toBuffer(), stickerMetadata: stk.metadata() },
            { quoted: msg }
        );
    }
    return { ok: true, mode: 'preview', count: preview };
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

        if (!token) {
            return ctx.reply('Telegram bot token missing (TELEGRAM_BOT_TOKEN).' + s.FOOTER);
        }

        const packInput = extractPackName(args[0]);
        if (!packInput) {
            return ctx.reply('Usage: `' + s.prefix + 'telesticker <t.me/addstickers/PackName>`' + s.FOOTER);
        }

        if (jobs.get(ctx.sender)) {
            return ctx.reply('Pack job already running. Use `' + s.prefix + 'telestop` to cancel.' + s.FOOTER);
        }

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

            const baseTitle = String(set.title || packInput).slice(0, 100);
            const publisher = String(s.ownerName || s.botBrand || 'MADARA X-MD').slice(0, 128);

            await ctx.reply(
                '📦 *' + baseTitle + '* — ' + set.stickers.length + ' sticker(s)\n' +
                'Pack size: ' + PACK_MAX + ' each (auto-split if more)…' + s.FOOTER
            );

            const all = [];
            let skipped = 0;

            for (let i = 0; i < set.stickers.length; i++) {
                if (!jobs.get(ctx.sender)) break;
                const st = set.stickers[i];
                if (st.is_animated) {
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
                    const buf = await stk.toBuffer();
                    if (!buf || buf.length < 100) {
                        skipped++;
                        continue;
                    }
                    all.push({
                        buf,
                        emojis: Array.isArray(st.emoji) ? st.emoji : (st.emoji ? [st.emoji] : ['⭐']),
                        isAnimated: !!st.is_video,
                    });
                } catch (e) {
                    console.error('[telesticker]', e.message);
                    skipped++;
                }
            }

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
                const label = batches.length === 1
                    ? baseTitle
                    : baseTitle + ' (' + (b + 1) + '/' + batches.length + ')';
                const r = await sendOnePack(sock, msg, ctx, label, publisher, batches[b]);
                results.push({ label, ...r });
            }

            jobs.delete(ctx.sender);
            await ctx.react('✅');

            const lines = results.map((r) =>
                '• *' + r.label + '* — ' + r.count + ' (' + r.mode + ')'
            );
            return ctx.reply(
                '✅ Done\n' +
                lines.join('\n') +
                (skipped ? '\nSkipped: ' + skipped : '') +
                s.FOOTER
            );
        } catch (e) {
            jobs.delete(ctx.sender);
            return ctx.reply(
                'Error: ' + ((e.response && e.response.data && e.response.data.description) || e.message) + s.FOOTER
            );
        }
    },
};
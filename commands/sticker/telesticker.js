'use strict';

const axios = require('axios');
const { Sticker, StickerTypes } = require('../../lib/sticker');

const PACK_MAX = 60;
const JOB_TTL_MS = 20 * 60 * 1000;

if (!global._telestickerJobs) global._telestickerJobs = new Map();
const jobs = global._telestickerJobs;

function extractPackName(input) {
    if (!input) return null;
    const m = String(input).match(/(?:t\.me\/addstickers\/|tg:\/\/addstickers\?set=)([A-Za-z0-9_]+)/i);
    return m ? m[1] : String(input).trim();
}

function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

/**
 * Native path — @itsliaaa/baileys prepareStickerPackMessage
 * Requires: cover + stickers[].data (Buffer), max 60
 */
async function sendNativePack(sock, jid, quoted, packName, publisher, items) {
    await sock.sendMessage(
        jid,
        {
            stickerPack: {
                name: packName.slice(0, 128),
                publisher: publisher.slice(0, 128),
                description: packName.slice(0, 128),
                cover: items[0].buf, // REQUIRED by prepareStickerPackMessage
                stickers: items.map((item) => ({
                    data: item.buf,
                    emojis: item.emojis && item.emojis.length ? item.emojis : ['⭐'],
                })),
            },
        },
        { quoted }
    );
}

/** Fallback: real stickers, shared pack EXIF (loads 100%, no pack card) */
async function sendIndividualPack(sock, jid, quoted, packName, publisher, items, maxSend) {
    const n = Math.min(items.length, maxSend || items.length);
    for (let i = 0; i < n; i++) {
        const stk = new Sticker(items[i].buf, { pack: packName, author: publisher });
        await sock.sendMessage(
            jid,
            {
                sticker: await stk.toBuffer(),
                stickerMetadata: stk.metadata(),
            },
            { quoted }
        );
    }
    return n;
}

module.exports = {
    name: 'telesticker',
    aliases: ['tsticker', 'tgpack'],
    category: 'sticker',
    desc: 'Telegram sticker set → WhatsApp pack (split every 60)',
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
                'Building pack(s) of ' + PACK_MAX + ' (native sticker-pack upload)…' + s.FOOTER
            );

            const all = [];
            let skipped = 0;

            for (let i = 0; i < set.stickers.length; i++) {
                if (!jobs.get(ctx.sender)) break;
                const st = set.stickers[i];
                // Static only for pack reliability (animated packs often fail >1MB)
                if (st.is_animated || st.is_video) {
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
                    const stk = new Sticker(fileUrl, {
                        pack: baseTitle,
                        author: publisher,
                        type: StickerTypes.DEFAULT,
                    });
                    const buf = await stk.toBuffer();
                    if (!buf || buf.length < 100) {
                        skipped++;
                        continue;
                    }
                    // WA sticker soft limit \~500KB–1MB each; skip huge
                    if (buf.length > 900 * 1024) {
                        skipped++;
                        continue;
                    }
                    all.push({
                        buf,
                        emojis: Array.isArray(st.emoji) ? st.emoji : (st.emoji ? [st.emoji] : ['⭐']),
                    });
                } catch (e) {
                    console.error('[telesticker] item:', e.message);
                    skipped++;
                }
            }

            if (!jobs.get(ctx.sender)) {
                jobs.delete(ctx.sender);
                return ctx.reply('Stopped.' + s.FOOTER);
            }
            if (!all.length) {
                jobs.delete(ctx.sender);
                return ctx.reply('No convertible static stickers.' + s.FOOTER);
            }

            const batches = chunk(all, PACK_MAX);
            const lines = [];

            for (let b = 0; b < batches.length; b++) {
                if (!jobs.get(ctx.sender)) break;
                const label =
                    batches.length === 1
                        ? baseTitle
                        : baseTitle + ' (' + (b + 1) + '/' + batches.length + ')';
                const items = batches[b];

                try {
                    await sendNativePack(sock, ctx.from, msg, label, publisher, items);
                    lines.push('• *' + label + '* — ' + items.length + ' ✅ pack');
                } catch (e) {
                    console.error('[telesticker] native pack failed:', e.message);
                    // Fallback so user still gets usable stickers
                    try {
                        const n = await sendIndividualPack(
                            sock, ctx.from, msg, label, publisher, items, Math.min(15, items.length)
                        );
                        lines.push('• *' + label + '* — pack failed, sent ' + n + ' stickers instead');
                        lines.push('_Pack error: ' + String(e.message).slice(0, 80) + '_');
                    } catch (e2) {
                        lines.push('• *' + label + '* — ❌ ' + String(e2.message).slice(0, 80));
                    }
                }
            }

            jobs.delete(ctx.sender);
            await ctx.react('✅');
            return ctx.reply(
                '✅ Done\n' + lines.join('\n') + (skipped ? '\nSkipped: ' + skipped : '') + s.FOOTER
            );
        } catch (e) {
            jobs.delete(ctx.sender);
            return ctx.reply(
                'Error: ' + ((e.response && e.response.data && e.response.data.description) || e.message) + s.FOOTER
            );
        }
    },
};
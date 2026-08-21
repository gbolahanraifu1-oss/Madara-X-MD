'use strict';
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  TELESTICKER
// Grabs an ENTIRE Telegram sticker pack (link or short name) and sends
// every sticker straight to the user as WhatsApp stickers — no index
// picking needed. WhatsApp groups stickers sent with the same pack+author
// EXIF into one visual pack in the recipient's tray/sticker store, but
// packs work best capped around ~30 stickers (the convention official
// Sticker Maker apps use) — if a Telegram pack has more than that, this
// splits the overflow into "PackName (2)", "PackName (3)", etc. so every
// sticker still gets delivered instead of silently dropping the rest.
// Usage: †telesticker <t.me/addstickers/PackName | PackName>
//        †telestop — cancels your own in-progress send
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const axios = require('axios');
const { Sticker, StickerTypes } = require('../../lib/sticker');

const PACK_LIMIT = 30;   // convention used by official Sticker Maker apps
const SEND_DELAY = 1500; // ms between sends — paced out, feels less like a flood

// Per-user cancel flags for in-progress jobs — shared with telestop.js
if (!global._telestickerJobs) global._telestickerJobs = new Map();
const jobs = global._telestickerJobs;

function extractPackName(input) {
    if (!input) return null;
    const m = input.match(/(?:t\.me\/addstickers\/|tg:\/\/addstickers\?set=)([A-Za-z0-9_]+)/i);
    return m ? m[1] : input.trim();
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

module.exports = {
    name: 'telesticker',
    aliases: ['tsticker', 'tgpack'],
    category: 'sticker',
    desc: 'sᴇɴᴅ ᴀɴ ᴇɴᴛɪʀᴇ ᴛᴇʟᴇɢʀᴀᴍ sᴛɪᴄᴋᴇʀ ᴘᴀᴄᴋ',
    usage: '†telesticker <pack link/name>',
    async execute(sock, msg, args, ctx) {
        const s     = ctx.settings;
        const token = process.env.TELEGRAM_BOT_TOKEN || s.telegramToken;

        if (!token) return ctx.reply(`❌ Telegram bot token isn't configured (TELEGRAM_BOT_TOKEN).${s.FOOTER}`);

        const packInput = extractPackName(args[0]);
        if (!packInput) return ctx.reply(`❌ Usage: \`${s.prefix}telesticker <t.me/addstickers/PackName>\`${s.FOOTER}`);

        if (jobs.get(ctx.sender)) {
            return ctx.reply(`⚠️ You already have a pack sending — use \`${s.prefix}telestop\` first if you want to cancel it.${s.FOOTER}`);
        }

        await ctx.react('⏳');
        try {
            const res = await axios.get(`https://api.telegram.org/bot${token}/getStickerSet`, {
                params: { name: packInput },
            });

            const set = res?.data?.result;
            if (!set || !set.stickers?.length) return ctx.reply(`❌ Couldn't find that Telegram sticker pack.${s.FOOTER}`);

            const total = set.stickers.length;

            // ── One-time instructions before anything gets sent ──────────
            const willSplit = total > PACK_LIMIT;
            await ctx.reply(
                `📦 *${set.title}* — ${total} sticker(s).\n\n` +
                `ʜᴇʀᴇ's ʜᴏᴡ ᴛʜɪs ᴡᴏʀᴋs:\n` +
                `• Stickers get sent one by one, ~${(SEND_DELAY/1000).toFixed(1)}s apart — this is a WhatsApp limit, not a choice, there's no bulk-delivery option.\n` +
                `• Long-press any sticker → *Add to Favorites* on your end to actually save it — the bot can't save into your tray directly.\n` +
                `• Every sticker here shares the same pack name, so WhatsApp groups them together once you favorite a few.\n` +
                (willSplit ? `• This pack has more than ${PACK_LIMIT}, so it'll split into multiple packs: *${set.title}*, *${set.title} (2)*, etc.\n` : '') +
                `• Lottie/.tgs animated stickers aren't supported yet and get skipped — regular video-based animated ones work fine.\n` +
                `• Changed your mind mid-send? \`${s.prefix}telestop\` cancels it.\n\n` +
                `sᴇɴᴅɪɴɢ ɴᴏᴡ...${s.FOOTER}`
            );

            jobs.set(ctx.sender, true);
            let sent = 0, skipped = 0, stopped = false;

            for (let i = 0; i < total; i++) {
                if (!jobs.get(ctx.sender)) { stopped = true; break; } // cancelled via .telestop

                const sticker = set.stickers[i];

                if (sticker.is_animated) {
                    skipped++; // Lottie (.tgs) — not supported for conversion yet
                    continue;
                }

                try {
                    const fileRes = await axios.get(`https://api.telegram.org/bot${token}/getFile`, {
                        params: { file_id: sticker.file_id },
                    });
                    const filePath = fileRes?.data?.result?.file_path;
                    if (!filePath) { skipped++; continue; }

                    const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
                    const type    = sticker.is_video ? StickerTypes.ANIMATED : StickerTypes.DEFAULT;

                    // Overflow past PACK_LIMIT rolls into a new pack name
                    // ("Title (2)", "Title (3)"...) instead of stopping.
                    const packNum   = Math.floor(sent / PACK_LIMIT) + 1;
                    const packLabel = packNum === 1 ? set.title : `${set.title} (${packNum})`;

                    const stkObj = new Sticker(fileUrl, { pack: packLabel, author: s.ownerName, type });
                    await sock.sendMessage(ctx.from, { sticker: await stkObj.toBuffer() }, { quoted: msg });

                    sent++;
                    await sleep(SEND_DELAY);
                } catch (e) {
                    console.error('[telesticker] sticker send failed:', e.message);
                    skipped++;
                }
            }

            jobs.delete(ctx.sender);

            if (stopped) {
                return ctx.reply(`🛑 Stopped — sent *${sent}* before cancelling.${s.FOOTER}`);
            }

            let summary = `✅ Sent *${sent}* sticker(s) from *${set.title}*.`;
            if (sent > PACK_LIMIT) summary += `\n📦 Split across ${Math.ceil(sent / PACK_LIMIT)} packs (${PACK_LIMIT}/pack).`;
            if (skipped) summary += `\n⚠️ Skipped *${skipped}* (Lottie/.tgs animated or failed to fetch).`;
            await ctx.reply(summary + s.FOOTER);
        } catch (e) {
            jobs.delete(ctx.sender);
            await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.response?.data?.description || e.message}${s.FOOTER}`);
        }
    }
};

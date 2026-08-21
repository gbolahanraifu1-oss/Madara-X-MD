'use strict';
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💣 MADARA X-MD  |  TGSTICKER
// Send a sticker from a Telegram pack. Emoji-only lookup used to fall
// back to api.mojisticker.com, which no longer resolves (dead domain) —
// there's no free "search Telegram stickers by emoji" API, so this now
// accepts a pack link/name directly (same fetch logic as .telesticker).
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const axios = require('axios');
const { Sticker, StickerTypes } = require('../../lib/sticker');

function extractPackName(input) {
    if (!input) return null;
    const m = input.match(/(?:t\.me\/addstickers\/|tg:\/\/addstickers\?set=)([A-Za-z0-9_]+)/i);
    return m ? m[1] : input.trim();
}

module.exports = {
    name: 'tgsticker', aliases: ['telegramsticker', 'tgs'],
    category: 'sticker', desc: 'sᴇɴᴅ ᴀ sᴛɪᴄᴋᴇʀ ғʀᴏᴍ ᴀ ᴛᴇʟᴇɢʀᴀᴍ ᴘᴀᴄᴋ',
    usage: '†tgsticker <pack link/name> [index]',
    async execute(sock, msg, args, ctx) {
        const s     = ctx.settings;
        const token = process.env.TELEGRAM_BOT_TOKEN || s.telegramToken;

        if (!token) return ctx.reply(`❌ Telegram bot token isn't configured (TELEGRAM_BOT_TOKEN).${s.FOOTER}`);

        const packInput = extractPackName(args[0]);
        if (!packInput || !/^[A-Za-z0-9_]+$/.test(packInput)) {
            return ctx.reply(
                `❌ Usage: \`${s.prefix}tgsticker <t.me/addstickers/PackName>\`\n\n` +
                `_Plain emoji lookup isn't supported anymore — the free API it relied on (mojisticker.com) is no longer online. Grab a sticker straight from a Telegram pack link instead — try \`${s.prefix}telesticker\`._${s.FOOTER}`
            );
        }

        const index = args[1] ? parseInt(args[1], 10) : null;

        await ctx.react('⏳');
        try {
            const res = await axios.get(`https://api.telegram.org/bot${token}/getStickerSet`, {
                params: { name: packInput },
            });

            const set = res?.data?.result;
            if (!set || !set.stickers?.length) return ctx.reply(`❌ Couldn't find that Telegram sticker pack.${s.FOOTER}`);

            const total = set.stickers.length;
            const pick  = index && index >= 1 && index <= total ? index - 1 : 0;
            const sticker = set.stickers[pick];

            if (sticker.is_animated) {
                return ctx.reply(`⚠️ *${set.title}* — sticker #${pick + 1} is a Lottie (.tgs) animated sticker, which isn't supported for conversion yet.\n\nTry a different index.\n\n_Pack has ${total} stickers total._${s.FOOTER}`);
            }

            const fileRes = await axios.get(`https://api.telegram.org/bot${token}/getFile`, {
                params: { file_id: sticker.file_id },
            });
            const filePath = fileRes?.data?.result?.file_path;
            if (!filePath) return ctx.reply(`❌ Couldn't fetch that sticker file from Telegram.${s.FOOTER}`);

            const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
            const type = sticker.is_video ? StickerTypes.ANIMATED : StickerTypes.DEFAULT;

            const stkObj = new Sticker(fileUrl, { pack: s.botName, author: s.ownerName, type });
            await sock.sendMessage(ctx.from, { sticker: await stkObj.toBuffer() }, { quoted: msg });
        } catch (e) {
            await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.response?.data?.description || e.message}${s.FOOTER}`);
        }
    }
};

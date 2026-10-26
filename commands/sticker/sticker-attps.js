'use strict';
const { downloadMediaMessage } = require('@itsliaaa/baileys');
const { Sticker, StickerTypes } = require('../../lib/sticker');
module.exports = {
    name: 'attp', aliases: ['astickertext', 'atts'],
    category: 'sticker', desc: 'ᴄᴏɴᴠᴇʀᴛ ᴛᴇxᴛ ᴛᴏ ᴀɴɪᴍᴀᴛᴇᴅ sᴛɪᴄᴋᴇʀ',
    usage: '†attp <text>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const text = args.join(' ');
        if (!text) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}attp Hello!${s.FOOTER}`);
        await ctx.react('⏳');
        try {
            const url = `https://api.memegen.link/images/attp/${encodeURIComponent(text)}.gif?width=512&height=512`;
            const axios = require('axios');
            const res = await axios.get(url, { responseType: 'arraybuffer' });
            const sticker = new Sticker(Buffer.from(res.data), {
                pack: s.botName, author: s.ownerName,
                type: StickerTypes.ANIMATED, quality: 70,
            });
            await sock.sendMessage(ctx.from, { sticker: await sticker.toBuffer() }, { quoted: msg });
        } catch (e) { await ctx.reply(`❌ ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`); }
    }
};

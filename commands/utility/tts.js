'use strict';
const axios  = require('axios');
module.exports = {
    name: 'tts', aliases: ['speak', 'voice'],
    category: 'utility', desc: 'ᴄᴏɴᴠᴇʀᴛ ᴛᴇxᴛ ᴛᴏ sᴘᴇᴇᴄʜ',
    usage: '†tts <text>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const text = args.join(' ');
        if (!text) return ctx.reply(`❌ *ᴜsᴀɢᴇ:* ${s.prefix}tts Hello world${s.FOOTER}`);
        try {
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
            await sock.sendMessage(ctx.from, {
                audio: { url }, mimetype: 'audio/mpeg', ptt: true
            }, { quoted: msg });
        } catch (e) { await ctx.reply(`❌ ᴛᴛs ᴇʀʀᴏʀ: ${e.message}${s.FOOTER}`); }
    }
};

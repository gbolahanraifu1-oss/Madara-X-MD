'use strict';
const { makeQuoteImage } = require('../../lib/quoteImage');
module.exports = {
    name: 'makequote', aliases: ['quotegen', 'fakequote'], category: 'misc',
    desc: 'Generate a Madara quote image locally', usage: '†makequote <text>',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const text = args.join(' ').trim();
        if (!text) return ctx.reply('❌ *ᴜsᴀɢᴇ:* ' + s.prefix + 'makequote Your text here' + s.FOOTER);
        try {
            const image = await makeQuoteImage(text, ctx.pushName || s.ownerName);
            return sock.sendMessage(ctx.from, { image, caption: '💬' + s.FOOTER }, { quoted: msg });
        } catch (error) { return ctx.reply('❌ Quote image could not be created.' + s.FOOTER); }
    },
};
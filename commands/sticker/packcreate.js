const db = require('../../lib/db');
module.exports = {
    name: 'packcreate',
    aliases: ['createpack', 'newpack', 'stickerpackcreate'],
    category: 'sticker',
    desc: 'Create a named custom sticker pack',
    usage: '†packcreate [pack name] | [author]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const parts = ctx.text.split('|').map(p => p.trim());
        const packName = parts[0] || `${s.botName} Pack`;
        const author   = parts[1] || s.botBrand;
        if (!packName) return ctx.reply(`❌ Usage: \`${s.prefix}packcreate My Pack | My Name\`${s.FOOTER}`);
        const key = `spackS${ctx.sender.split('@')[0]}`;
        db.set('stickerpacks', key, { name: packName, author, stickers: [], created: Date.now() });
        ctx.reply(
            `✅ *Sticker Pack Created!*\n📦 Name: *${packName}*\n✍️ Author: *${author}*\n\n` +
            `Add stickers with \`${s.prefix}stickeradd\` (reply to image)\nList packs with \`${s.prefix}stickerlist\`${s.FOOTER}`
        );
    }
};

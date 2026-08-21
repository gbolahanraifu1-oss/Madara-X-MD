const db = require('../../lib/db');
module.exports = {
    name: 'stickerlist',
    aliases: ['mystickerpack', 'stickercollection'],
    category: 'sticker',
    desc: 'List your saved custom stickers',
    usage: '†stickerlist',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const key = `stickerlist_${ctx.sender.split('@')[0]}`;
        const lst = db.get('stickers', key, []);
        if (!lst.length) return ctx.reply(`📦 No saved stickers.\nUse \`${s.prefix}stickeradd\` (reply to sticker) to save one.${s.FOOTER}`);
        ctx.reply(
            `📦 *Your Sticker Collection (${lst.length}):*\n\n` +
            lst.map((s2, i) => `${i + 1}. *${s2.name}* — _${s2.saved}_`).join('\n') +
            `\n\nUse \`${s.prefix}stickerdelete [name]\` to remove.${s.FOOTER}`
        );
    }
};

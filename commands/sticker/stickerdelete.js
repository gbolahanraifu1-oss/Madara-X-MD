const db = require('../../lib/db');
module.exports = {
    name: 'stickerdelete',
    aliases: ['deletesticker', 'removesticker'],
    category: 'sticker',
    desc: 'Delete a saved sticker from your collection',
    usage: '†stickerdelete [name]',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const name = ctx.text;
        if (!name) return ctx.reply(`❌ Provide a sticker name.\n_Use \`${s.prefix}stickerlist\` to see your stickers._${s.FOOTER}`);
        const key  = `stickerlist_${ctx.sender.split('@')[0]}`;
        let lst    = db.get('stickers', key, []);
        const before = lst.length;
        lst = lst.filter(s2 => s2.name !== name);
        if (lst.length === before) return ctx.reply(`❌ Sticker *${name}* not found.${s.FOOTER}`);
        db.set('stickers', key, lst);
        ctx.reply(`🗑️ Sticker *${name}* deleted.${s.FOOTER}`);
    }
};

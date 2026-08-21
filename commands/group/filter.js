const db = require('../../lib/db');
module.exports = {
    name: 'filter',
    aliases: ['addfilter', 'autoreply'],
    category: 'group',
    desc: 'Add auto-reply keyword filter',
    usage: '†filter [keyword] | [response]',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const full = ctx.text;
        const parts = full.split('|').map(p => p.trim());
        if (parts.length < 2) return ctx.reply(`❌ Usage: \`${s.prefix}filter hello | Hi there!\`${s.FOOTER}`);
        const keyword = parts[0].toLowerCase();
        const response = parts[1];
        const key = `filters_${ctx.from}`;
        const filters = db.get('filters', key, {});
        filters[keyword] = response;
        db.set('filters', key, filters);
        ctx.reply(`✅ Filter added!\n*Keyword:* "${keyword}"\n*Response:* "${response}"${s.FOOTER}`);
    }
};

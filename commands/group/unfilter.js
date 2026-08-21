const db = require('../../lib/db');
module.exports = {
    name: 'unfilter',
    aliases: ['removefilter', 'delfilter'],
    category: 'group',
    desc: 'Remove a keyword filter',
    usage: '†unfilter [keyword]',
    groupOnly: true, adminOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const keyword = args.join(' ').toLowerCase();
        if (!keyword) return ctx.reply(`❌ Usage: \`${s.prefix}unfilter hello\`${s.FOOTER}`);
        const key = `filters_${ctx.from}`;
        const filters = db.get('filters', key, {});
        if (!filters[keyword]) return ctx.reply(`❌ Filter *"${keyword}"* not found.${s.FOOTER}`);
        delete filters[keyword];
        db.set('filters', key, filters);
        ctx.reply(`✅ Filter *"${keyword}"* removed.${s.FOOTER}`);
    }
};

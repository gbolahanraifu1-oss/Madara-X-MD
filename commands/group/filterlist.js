const db = require('../../lib/db');
module.exports = {
    name: 'filterlist',
    aliases: ['filters', 'listfilters', 'showfilters'],
    category: 'group',
    desc: 'List all active keyword filters in this group',
    usage: '†filterlist',
    groupOnly: true,
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const key = `filters_${ctx.from}`;
        const filters = db.get('filters', key, {});
        const list = Object.entries(filters);
        if (!list.length) return ctx.reply(`📋 No filters set.\nAdd one: \`${s.prefix}filter keyword | response\`${s.FOOTER}`);
        const out = list.map(([k, v], i) => `${i+1}. *"${k}"* → ${v}`).join('\n');
        ctx.reply(`📋 *Active Filters (${list.length}):*\n\n${out}${s.FOOTER}`);
    }
};

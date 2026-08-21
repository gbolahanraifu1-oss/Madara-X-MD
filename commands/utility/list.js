module.exports = {
    name: 'list',
    aliases: ['makelist', 'numbered'],
    category: 'utility',
    desc: 'Create a numbered list from comma-separated items',
    usage: '†list item1, item2, item3',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s     = ctx.settings;
        const text  = ctx.text;
        if (!text) return ctx.reply(`❌ Provide items separated by commas.${s.FOOTER}`);
        const items = text.split(',').map(i => i.trim()).filter(Boolean);
        if (items.length < 2) return ctx.reply(`❌ Provide at least 2 items.${s.FOOTER}`);
        const list  = items.map((item, i) => `${i + 1}. ${item}`).join('\n');
        ctx.reply(`📋 *List (${items.length} items):*\n\n${list}${s.FOOTER}`);
    }
};

module.exports = {
    name: 'sort',
    aliases: ['sortlist', 'alphabetize'],
    category: 'utility',
    desc: 'Sort a comma-separated list alphabetically or numerically',
    usage: '†sort banana, apple, cherry',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s    = ctx.settings;
        const text = ctx.text;
        if (!text) return ctx.reply(`❌ Provide a comma-separated list.${s.FOOTER}`);
        const items  = text.split(',').map(i => i.trim()).filter(Boolean);
        const isNums = items.every(i => !isNaN(i));
        const sorted = isNums ? [...items].sort((a, b) => Number(a) - Number(b)) : [...items].sort((a, b) => a.localeCompare(b));
        ctx.reply(`📋 *Sorted List:*\n\n${sorted.map((i, n) => `${n + 1}. ${i}`).join('\n')}${s.FOOTER}`);
    }
};

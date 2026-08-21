module.exports = {
    name: 'pollcreate',
    aliases: ['advancedpoll', 'multipoll'],
    category: 'utility',
    desc: 'Create a multi-select poll (up to 12 options)',
    usage: '†pollcreate Question | Opt1 | Opt2 | Opt3 | ...',
    async execute(sock, msg, args, ctx) {
        const s     = ctx.settings;
        const full  = ctx.text;
        if (!full?.includes('|')) return ctx.reply(`❌ Usage: \`${s.prefix}pollcreate Best language? | JavaScript | Python | Go | Rust\`${s.FOOTER}`);
        const parts   = full.split('|').map(p => p.trim()).filter(Boolean);
        const name    = parts[0];
        const options = parts.slice(1).slice(0, 12);
        if (options.length < 2) return ctx.reply(`❌ Need at least 2 options.${s.FOOTER}`);
        await sock.sendMessage(ctx.from, {
            poll: { name, values: options, selectableCount: options.length }
        });
    }
};

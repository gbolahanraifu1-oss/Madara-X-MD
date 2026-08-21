module.exports = {
    name: 'random', aliases: ['rand','randomnum','pick'], category: 'utility',
    desc: 'Random number or random choice from list', usage: '†random [max] | †random [a, b, c]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings; const inp = args.join(' ');
        if (!inp) { return ctx.reply(`🎲 *Random (1–100):* *${Math.floor(Math.random()*100)+1}*${s.FOOTER}`); }
        if (inp.includes(',')) {
            const choices = inp.split(',').map(c => c.trim()).filter(Boolean);
            const pick    = choices[Math.floor(Math.random()*choices.length)];
            return ctx.reply(`🎲 *Random Choice:*\nFrom: ${choices.join(' | ')}\n\n🏆 *Picked: ${pick}*${s.FOOTER}`);
        }
        const max = parseInt(inp);
        if (!isNaN(max) && max > 0) { ctx.reply(`🎲 *Random (1–${max}):* *${Math.floor(Math.random()*max)+1}*${s.FOOTER}`); }
        else { ctx.reply(`❌ Usage:\n\`${s.prefix}random 100\`\n\`${s.prefix}random apple, banana, mango\`${s.FOOTER}`); }
    }
};

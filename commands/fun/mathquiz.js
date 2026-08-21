const active = new Map();
module.exports = {
    name: 'mathquiz',
    aliases: ['mathgame', 'calculate2'],
    category: 'fun',
    desc: 'Random math quiz challenge',
    usage: '†mathquiz',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s  = ctx.settings;
        const ops = ['+', '-', '*'];
        const op  = ops[Math.floor(Math.random() * ops.length)];
        const a   = Math.floor(Math.random() * 50) + 1;
        const b   = Math.floor(Math.random() * 50) + 1;
        let ans;
        if (op === '+') ans = a + b;
        else if (op === '-') ans = a - b;
        else ans = a * b;
        active.set(ctx.from, { ans, timeout: setTimeout(() => {
            active.delete(ctx.from);
            sock.sendMessage(ctx.from, { text: `⏰ Time's up! Answer: *${ans}*${s.FOOTER}` });
        }, 20000)});
        ctx.reply(`🔢 *MATH QUIZ!*\n\n*${a} ${op} ${b} = ?*\n\n_20 seconds — reply with the answer!_${s.FOOTER}`);
    }
};
module.exports.active = active;

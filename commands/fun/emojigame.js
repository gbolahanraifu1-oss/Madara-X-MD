const active = new Map();
const puzzles = [
    { emojis: '🦁👑', answer: 'lion king', hint: 'Disney movie' },
    { emojis: '❄️👸', answer: 'frozen', hint: 'Disney movie' },
    { emojis: '🕷️👨', answer: 'spiderman', hint: 'Marvel hero' },
    { emojis: '🦇👨', answer: 'batman', hint: 'DC hero' },
    { emojis: '🌊🐟', answer: 'finding nemo', hint: 'Pixar movie' },
    { emojis: '👻🚫', answer: 'ghostbusters', hint: 'Classic movie' },
    { emojis: '🍕🐢👦', answer: 'ninja turtles', hint: 'Pizza lovers' },
    { emojis: '🧙‍♂️💍', answer: 'lord of the rings', hint: 'Fantasy epic' },
    { emojis: '🚀♾️', answer: 'infinity war', hint: 'Marvel movie' },
    { emojis: '🐉🔥', answer: 'game of thrones', hint: 'HBO series' },
];
module.exports = {
    name: 'emojigame',
    aliases: ['emojiriddle', 'guessmovie'],
    category: 'fun',
    desc: 'Guess the movie/show from emojis',
    usage: '†emojigame',
    waitReact: false,
    async execute(sock, msg, args, ctx) {
        const s   = ctx.settings;
        const sub = (args[0] || '').toLowerCase();
        if (sub === 'answer' || sub === 'ans') {
            const g = active.get(ctx.from);
            if (!g) return ctx.reply(`❌ No active game. Use \`${s.prefix}emojigame\` to start.${s.FOOTER}`);
            active.delete(ctx.from);
            return ctx.reply(`💡 *Answer:* *${g.answer.toUpperCase()}*\n_Hint: ${g.hint}_${s.FOOTER}`);
        }
        const p = puzzles[Math.floor(Math.random() * puzzles.length)];
        active.set(ctx.from, p);
        setTimeout(() => { if (active.get(ctx.from) === p) { active.delete(ctx.from); sock.sendMessage(ctx.from, { text: `⏰ Time's up! Answer: *${p.answer.toUpperCase()}*${s.FOOTER}` }); }}, 30000);
        ctx.reply(`🎭 *EMOJI GAME!*\n\n${p.emojis}\n\n_What movie/show is this?_\nHint: _${p.hint}_\n\n\`${s.prefix}emojigame answer\` to reveal — *30 seconds!*${s.FOOTER}`);
    }
};

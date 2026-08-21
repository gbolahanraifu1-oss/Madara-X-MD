module.exports = {
    name: 'proquote', aliases: ['programmerquote','devquote','codequote'], category: 'fun',
    desc: 'Random programming quote', usage: '†proquote',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const quotes = [
            { q: "Any fool can write code a computer understands. Good programmers write code humans understand.", a: 'Martin Fowler' },
            { q: "First, solve the problem. Then, write the code.", a: 'John Johnson' },
            { q: "Code is like humor. When you have to explain it, it's bad.", a: 'Cory House' },
            { q: "The best code is no code at all.", a: 'Jeff Atwood' },
            { q: "Talk is cheap. Show me the code.", a: 'Linus Torvalds' },
            { q: "Debugging is twice as hard as writing the code in the first place.", a: 'Brian Kernighan' },
            { q: "It works on my machine.", a: 'Every Developer Ever' },
            { q: "Make it work, make it right, make it fast.", a: 'Kent Beck' },
        ];
        const q = quotes[Math.floor(Math.random() * quotes.length)];
        ctx.reply(`💻 *Programming Quote:*\n\n_"${q.q}"_\n\n— *${q.a}*${s.FOOTER}`);
    }
};

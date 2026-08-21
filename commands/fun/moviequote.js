module.exports = { name: 'moviequote', aliases: ['filmquote','movieline'], category: 'fun', desc: 'Famous movie quote', usage: '†moviequote',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings;
        const q=[{q:'May the Force be with you.',m:'Star Wars'},{q:"I'll be back.",m:'The Terminator'},{q:"You can't handle the truth!",m:'A Few Good Men'},{q:'Life is like a box of chocolates.',m:'Forrest Gump'},{q:'Why so serious?',m:'The Dark Knight'},{q:'To infinity and beyond!',m:'Toy Story'},{q:'I am your father.',m:'Empire Strikes Back'},{q:'With great power comes great responsibility.',m:'Spider-Man'}];
        const pick=q[Math.floor(Math.random()*q.length)];
        ctx.reply(`🎬 *Movie Quote:*\n\n_"${pick.q}"_\n\n— 📽️ _${pick.m}_${s.FOOTER}`);
    }
};

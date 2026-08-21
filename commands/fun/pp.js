module.exports = { name: 'pp', aliases: ['ppsize','sizechecker'], category: 'fun', desc: 'Fun size estimator (joke command)', usage: '†pp [@user?]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const m=ctx.getMentions?.()??[]; const target=m[0]?.split('@')[0]||args[0]||ctx.sender.split('@')[0];
        const size=Math.floor(Math.random()*21); const bar='█'.repeat(size)+'░'.repeat(20-size);
        ctx.reply(`📏 *Size Estimator (joke!):*\n\n@${target}:\n[${bar}] ${size}/20\n\n_Just for fun, don't take it seriously 😂_${s.FOOTER}`,{mentions:m});
    }
};

module.exports = { name: 'gaymeter', aliases: ['gaytest','pride'], category: 'fun', desc: 'Fun gay meter (joke only)', usage: '†gaymeter [@user?]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const m=ctx.getMentions?.()??[]; const target=m[0]?.split('@')[0]||args[0]||ctx.sender.split('@')[0];
        const score=Math.floor(Math.random()*101);
        ctx.reply(`🏳️‍🌈 *Gay Meter (just for fun!):*\n\n@${target}: *${score}%*\n${'🌈'.repeat(Math.round(score/10))}${'⬜'.repeat(10-Math.round(score/10))}\n\n_This is just for fun! No real meaning. 🏳️‍🌈_${s.FOOTER}`,{mentions:m});
    }
};

module.exports = { name: 'rpsls', aliases: ['rockpaperscissorsls','bigbangtheory'], category: 'fun', desc: 'Rock-Paper-Scissors-Lizard-Spock', usage: '†rpsls [rock|paper|scissors|lizard|spock]',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings; const choice=(args[0]||'').toLowerCase();
        const valid=['rock','paper','scissors','lizard','spock'];
        if (!valid.includes(choice)) return ctx.reply(`❌ Choose: ${valid.join(', ')}${s.FOOTER}`);
        const bot=valid[Math.floor(Math.random()*valid.length)];
        const wins={rock:['scissors','lizard'],paper:['rock','spock'],scissors:['paper','lizard'],lizard:['paper','spock'],spock:['scissors','rock']};
        const result=choice===bot?'🤝 Draw!':wins[choice].includes(bot)?'🎉 You Win!':'💀 Bot Wins!';
        const emojis={rock:'🪨',paper:'📄',scissors:'✂️',lizard:'🦎',spock:'🖖'};
        ctx.reply(`🎮 *RPSLS:*\n\nYou: ${emojis[choice]} *${choice}*\nBot: ${emojis[bot]} *${bot}*\n\n*${result}*${s.FOOTER}`);
    }
};

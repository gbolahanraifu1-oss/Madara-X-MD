module.exports = { name: 'fortune', aliases: ['fortunecookie','luckymsg','fortune2'], category: 'fun', desc: 'Get a fortune cookie message', usage: '†fortune',
    async execute(sock, msg, args, ctx) {
        const s=ctx.settings;
        const fortunes=['🥠 A pleasant surprise is waiting for you.','🥠 Good things come to those who work while they wait.','🥠 Your creativity will lead you to great heights.','🥠 The answer you seek lies within yourself.','🥠 An unexpected journey will bring unexpected rewards.','🥠 Today is a lucky day — embrace every opportunity.','🥠 A dream you have been holding will soon come true.','🥠 Your hard work is about to pay off enormously.'];
        ctx.reply(`🥠 *Fortune Cookie:*\n\n${fortunes[Math.floor(Math.random()*fortunes.length)]}${s.FOOTER}`);
    }
};

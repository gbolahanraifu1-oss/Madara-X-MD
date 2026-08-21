const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'horoscopeai',
    aliases: ['aihoroscope', 'zodiacai'],
    category: 'ai',
    desc: 'AI horoscope',
    usage: '†horoscopeai [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}horoscopeai [input]\`${s.FOOTER}`);
        await ctx.react('⭐');
        try {
            const result = await aiQuery("Write a fun horoscope for today for:\n\n" + input);
            ctx.reply(`⭐ *AI horoscope:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};

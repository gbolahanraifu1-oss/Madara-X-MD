const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'sentiment',
    aliases: ['sentimentanalysis', 'analyzefeel'],
    category: 'ai',
    desc: 'Analyze sentiment',
    usage: '†sentiment [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}sentiment [input]\`${s.FOOTER}`);
        await ctx.react('😊');
        try {
            const result = await aiQuery('Analyze this text sentiment (positive/negative/neutral, confidence %, emotions):\n\n' + input);
            ctx.reply(`😊 *Analyze sentiment:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};

const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'aianalyze',
    aliases: ['analyze', 'deepanalyze', 'aiinspect'],
    category: 'ai',
    desc: 'Deep AI analysis of replied text',
    usage: '†aianalyze [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}aianalyze [input]\`${s.FOOTER}`);
        await ctx.react('🔬');
        try {
            const result = await aiQuery('Deeply analyze this text. Cover: sentiment, topics, writing style, key claims:\n\n' + input);
            ctx.reply(`🔬 *Deep AI analysis of replied text:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};

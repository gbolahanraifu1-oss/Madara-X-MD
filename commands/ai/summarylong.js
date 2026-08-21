const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'summarylong',
    aliases: ['longsummary', 'keypoints'],
    category: 'ai',
    desc: 'Detailed summary',
    usage: '†summarylong [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}summarylong [input]\`${s.FOOTER}`);
        await ctx.react('📋');
        try {
            const result = await aiQuery('Provide a detailed summary with 5 key bullet points of:\n\n' + input);
            ctx.reply(`📋 *Detailed summary:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};

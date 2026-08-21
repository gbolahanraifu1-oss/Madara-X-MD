const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'qna',
    aliases: ['askdoc', 'docqa'],
    category: 'ai',
    desc: 'Q&A from text',
    usage: '†qna [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}qna [input]\`${s.FOOTER}`);
        await ctx.react('🤔');
        try {
            const result = await aiQuery('Based on this context, answer the question:\n\n' + input);
            ctx.reply(`🤔 *Q&A from text:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};

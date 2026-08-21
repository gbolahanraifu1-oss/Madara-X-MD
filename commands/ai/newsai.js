const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'newsai',
    aliases: ['ainews', 'newsbrief'],
    category: 'ai',
    desc: 'AI news summary',
    usage: '†newsai [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}newsai [input]\`${s.FOOTER}`);
        await ctx.react('📰');
        try {
            const result = await aiQuery('Give 5 recent news headlines about:\n\n' + input);
            ctx.reply(`📰 *AI news summary:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};

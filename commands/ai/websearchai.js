const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'websearchai',
    aliases: ['aisearch', 'aiquery'],
    category: 'ai',
    desc: 'AI web search summary',
    usage: '†websearchai [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}websearchai [input]\`${s.FOOTER}`);
        await ctx.react('🌐');
        try {
            const result = await aiQuery('Answer this as if you searched the web:\n\n' + input);
            ctx.reply(`🌐 *AI web search summary:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};

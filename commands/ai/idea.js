const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'idea',
    aliases: ['brainstorm', 'creativeidea'],
    category: 'ai',
    desc: 'Generate ideas',
    usage: '†idea [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}idea [input]\`${s.FOOTER}`);
        await ctx.react('💡');
        try {
            const result = await aiQuery('Generate 5 creative innovative ideas for:\n\n' + input);
            ctx.reply(`💡 *Generate ideas:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};

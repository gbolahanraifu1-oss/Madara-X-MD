const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'dream',
    aliases: ['dreaminterpret', 'dreammean'],
    category: 'ai',
    desc: 'Dream interpretation',
    usage: '†dream [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}dream [input]\`${s.FOOTER}`);
        await ctx.react('💭');
        try {
            const result = await aiQuery('Interpret this dream using psychology and symbolism:\n\n' + input);
            ctx.reply(`💭 *Dream interpretation:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};

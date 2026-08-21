const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'poemgen',
    aliases: ['aipoem', 'generatepoem'],
    category: 'ai',
    desc: 'AI poem generator',
    usage: '†poemgen [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}poemgen [input]\`${s.FOOTER}`);
        await ctx.react('🎭');
        try {
            const result = await aiQuery('Write a creative poem about:\n\n' + input);
            ctx.reply(`🎭 *AI poem generator:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};

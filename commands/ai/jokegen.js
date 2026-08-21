const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'jokegen',
    aliases: ['generatejoke', 'customjoke'],
    category: 'ai',
    desc: 'Custom joke generator',
    usage: '†jokegen [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}jokegen [input]\`${s.FOOTER}`);
        await ctx.react('😂');
        try {
            const result = await aiQuery('Tell a funny original joke about:\n\n' + input);
            ctx.reply(`😂 *Custom joke generator:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};

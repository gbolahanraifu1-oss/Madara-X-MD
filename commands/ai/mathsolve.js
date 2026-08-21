const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'mathsolve',
    aliases: ['solvemath', 'mathsolver'],
    category: 'ai',
    desc: 'AI math solver',
    usage: '†mathsolve [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}mathsolve [input]\`${s.FOOTER}`);
        await ctx.react('🧮');
        try {
            const result = await aiQuery('Solve this math problem step by step:\n\n' + input);
            ctx.reply(`🧮 *AI math solver:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};

const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'debugcode',
    aliases: ['debug', 'fixcode'],
    category: 'ai',
    desc: 'Debug code',
    usage: '†debugcode [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}debugcode [input]\`${s.FOOTER}`);
        await ctx.react('🐛');
        try {
            const result = await aiQuery('Debug and fix this code. Explain the bug and show corrected version:\n\n' + input);
            ctx.reply(`🐛 *Debug code:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};

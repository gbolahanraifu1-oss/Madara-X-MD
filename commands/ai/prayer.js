const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'prayer',
    aliases: ['generateprayer', 'bless'],
    category: 'ai',
    desc: 'Generate prayer/blessing',
    usage: '†prayer [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}prayer [input]\`${s.FOOTER}`);
        await ctx.react('🙏');
        try {
            const result = await aiQuery('Write a short sincere blessing for:\n\n' + input);
            ctx.reply(`🙏 *Generate prayer/blessing:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};

const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'airoast',
    aliases: ['roastadvanced', 'contextroast'],
    category: 'ai',
    desc: 'Advanced AI roast with context',
    usage: '†airoast [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}airoast [input]\`${s.FOOTER}`);
        await ctx.react('🔥');
        try {
            const result = await aiQuery('Generate a savage but funny playful roast. Clever and witty. 3 sentences.\n\n' + input);
            ctx.reply(`🔥 *Advanced AI roast with context:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};

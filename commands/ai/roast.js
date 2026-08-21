const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'roast',
    aliases: ['burnme', 'getroasted'],
    category: 'ai',
    desc: 'Roast someone',
    usage: '†roast [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}roast [input]\`${s.FOOTER}`);
        await ctx.react('🔥');
        try {
            const result = await aiQuery('Write a funny light-hearted roast. 2 sentences. Not offensive.\n\n' + input);
            ctx.reply(`🔥 *Roast someone:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};

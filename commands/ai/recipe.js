const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'recipe',
    aliases: ['getrecipe', 'makerecipe'],
    category: 'ai',
    desc: 'Generate recipe',
    usage: '†recipe [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}recipe [input]\`${s.FOOTER}`);
        await ctx.react('🍳');
        try {
            const result = await aiQuery('Create a delicious recipe using these ingredients:\n\n' + input);
            ctx.reply(`🍳 *Generate recipe:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};

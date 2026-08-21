const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'storygen',
    aliases: ['generatestory', 'storyteller'],
    category: 'ai',
    desc: 'Generate a short story',
    usage: '†storygen [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}storygen [input]\`${s.FOOTER}`);
        await ctx.react('📖');
        try {
            const result = await aiQuery('Write a compelling short story (200 words) about:\n\n' + input);
            ctx.reply(`📖 *Generate a short story:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};

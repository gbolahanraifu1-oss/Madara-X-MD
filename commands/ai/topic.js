const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'topic',
    aliases: ['extracttopic', 'keywords'],
    category: 'ai',
    desc: 'Extract topics/keywords',
    usage: '†topic [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}topic [input]\`${s.FOOTER}`);
        await ctx.react('🏷️');
        try {
            const result = await aiQuery('Extract 5-8 main topics and keywords as numbered list:\n\n' + input);
            ctx.reply(`🏷️ *Extract topics/keywords:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};

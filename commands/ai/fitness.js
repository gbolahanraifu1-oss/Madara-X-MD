const { aiQuery } = require('../../lib/ai');
module.exports = {
    name: 'fitness',
    aliases: ['workoutplan', 'fitplan'],
    category: 'ai',
    desc: 'AI fitness plan',
    usage: '†fitness [input]',
    async execute(sock, msg, args, ctx) {
        const s = ctx.settings;
        const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
        const input = args.join(' ') || ctxInfo?.quotedMessage?.conversation || ctxInfo?.quotedMessage?.extendedTextMessage?.text || '';
        if (!input) return ctx.reply(`❌ Usage: \`${s.prefix}fitness [input]\`${s.FOOTER}`);
        await ctx.react('💪');
        try {
            const result = await aiQuery('Create a beginner-friendly workout plan for:\n\n' + input);
            ctx.reply(`💪 *AI fitness plan:*\n\n${result}${s.FOOTER}`);
        } catch (e) {
            ctx.reply(`❌ ${e.message}${s.FOOTER}`);
        }
    }
};
